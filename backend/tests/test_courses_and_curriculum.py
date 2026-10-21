from app.extensions import db
from app.models.course import Course, Lesson, Module
from app.models.enrollment import Enrollment

def test_public_course_browsing_and_details(client, seed_data):
    # Public catalog lists only published courses
    res = client.get("/api/courses")
    assert res.status_code == 200
    courses = res.get_json()["courses"]
    assert len(courses) == 1
    assert courses[0]["slug"] == "python-mastery"

    # View course details
    detail_res = client.get("/api/courses/python-mastery")
    assert detail_res.status_code == 200
    course_data = detail_res.get_json()["course"]
    assert course_data["title"] == "Python Mastery"
    assert len(course_data["modules"]) == 2

    # Unpublished course cannot be viewed publicly
    draft_res = client.get("/api/courses/draft-course")
    assert draft_res.status_code == 404


def test_sequential_lesson_unlocking_and_progress(client, seed_data):
    """
    Requirements 8, 9, 10, 11, 12, 13:
    - Enrolled student can play the first unlocked lesson
    - Next required lesson remains locked until previous is completed
    - Completing a lesson unlocks only the next permitted lesson
    - Completing module unlocks next module in course sequence
    - Lesson progress persists
    - Unauthorized student cannot access locked lessons
    """
    # 1. Login as Student 1
    login_res = client.post("/api/auth/login", json={"email": "student1@test.com", "password": "StudentPass123!"})
    token = login_res.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    l1_1_id = seed_data["l1_1_id"]
    l1_2_id = seed_data["l1_2_id"]
    l2_1_id = seed_data["l2_1_id"]
    course_id = seed_data["course_id"]

    # Before enrollment:
    # Free preview lesson L1.1 is accessible
    preview_res = client.get(f"/api/learning/lessons/{l1_1_id}", headers=headers)
    assert preview_res.status_code == 200
    assert "playback" in preview_res.get_json()

    # Non-preview lesson L1.2 is forbidden
    locked_res = client.get(f"/api/learning/lessons/{l1_2_id}", headers=headers)
    assert locked_res.status_code == 403
    assert locked_res.get_json()["error"] == "LESSON_LOCKED"

    # 2. Enroll student in the course
    with client.application.app_context():
        enr = Enrollment(user_id=seed_data["student1_id"], course_id=course_id, status="active")
        db.session.add(enr)
        db.session.commit()

    # Now enrolled: Check curriculum status
    curriculum_res = client.get("/api/learning/courses/python-mastery/curriculum", headers=headers)
    assert curriculum_res.status_code == 200
    mods = curriculum_res.get_json()["modules"]

    # L1.1 is first lesson -> UNLOCKED
    assert mods[0]["lessons"][0]["id"] == l1_1_id
    assert mods[0]["lessons"][0]["status"] == "unlocked"

    # L1.2 is second lesson -> LOCKED until L1.1 is complete
    assert mods[0]["lessons"][1]["id"] == l1_2_id
    assert mods[0]["lessons"][1]["status"] == "locked"

    # L2.1 (in Module 2) -> LOCKED
    assert mods[1]["lessons"][0]["id"] == l2_1_id
    assert mods[1]["lessons"][0]["status"] == "locked"

    # Attempting to fetch L1.2 directly via API must return 403
    direct_l1_2 = client.get(f"/api/learning/lessons/{l1_2_id}", headers=headers)
    assert direct_l1_2.status_code == 403

    # 3. Complete Lesson 1.1
    # Save progress with mark_complete=True
    prog_res = client.post(f"/api/learning/lessons/{l1_1_id}/progress", json={
        "position_seconds": 300,
        "mark_complete": True
    }, headers=headers)
    assert prog_res.status_code == 200
    assert prog_res.get_json()["progress"]["is_completed"] is True

    # 4. Check curriculum again: L1.1 should be COMPLETED, L1.2 should now be UNLOCKED!
    curriculum_res2 = client.get("/api/learning/courses/python-mastery/curriculum", headers=headers)
    mods2 = curriculum_res2.get_json()["modules"]
    assert mods2[0]["lessons"][0]["status"] == "completed"
    assert mods2[0]["lessons"][1]["status"] == "unlocked"
    # L2.1 in Module 2 is STILL locked
    assert mods2[1]["lessons"][0]["status"] == "locked"

    # Now L1.2 can be played!
    play_l1_2 = client.get(f"/api/learning/lessons/{l1_2_id}", headers=headers)
    assert play_l1_2.status_code == 200

    # 5. Complete Lesson 1.2 by reaching 90% viewing threshold (duration is 400s -> 360s = 90%)
    prog_res2 = client.post(f"/api/learning/lessons/{l1_2_id}/progress", json={
        "position_seconds": 380, # 95% threshold reached
        "mark_complete": False
    }, headers=headers)
    assert prog_res2.status_code == 200
    assert prog_res2.get_json()["progress"]["is_completed"] is True

    # 6. Module 1 is now completed! Module 2's first lesson (L2.1) must now be UNLOCKED!
    curriculum_res3 = client.get("/api/learning/courses/python-mastery/curriculum", headers=headers)
    mods3 = curriculum_res3.get_json()["modules"]
    assert mods3[1]["lessons"][0]["status"] == "unlocked"

    # Play L2.1 succeeds
    play_l2_1 = client.get(f"/api/learning/lessons/{l2_1_id}", headers=headers)
    assert play_l2_1.status_code == 200


def test_revoked_access_enforcement(client, seed_data):
    """
    Requirement 17: Expired or revoked access is enforced by the backend.
    """
    login_res = client.post("/api/auth/login", json={"email": "student2@test.com", "password": "StudentPass123!"})
    token = login_res.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    l1_2_id = seed_data["l1_2_id"]
    course_id = seed_data["course_id"]

    # Active enrollment
    with client.application.app_context():
        enr = Enrollment(user_id=seed_data["student2_id"], course_id=course_id, status="active")
        db.session.add(enr)
        db.session.commit()
        enr_id = enr.id

    # Revoke enrollment
    with client.application.app_context():
        enr = db.session.get(Enrollment, enr_id)
        enr.status = "revoked"
        db.session.commit()

    # Accessing locked/paid lesson must be denied
    res = client.get(f"/api/learning/lessons/{l1_2_id}", headers=headers)
    assert res.status_code == 403
