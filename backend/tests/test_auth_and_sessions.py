import json

def test_student_registration_and_login(client):
    # 1. Register new student
    res = client.post("/api/auth/register", json={
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "Password123!"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert "token" in data
    assert data["user"]["email"] == "jane@example.com"
    token = data["token"]

    # 2. Access me endpoint with token
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.get_json()["user"]["name"] == "Jane Doe"

    # 3. Logout
    res = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

    # 4. Access me endpoint after logout -> should be rejected
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401


def test_single_device_login_restriction(client, seed_data):
    """
    Requirement 2: A new login invalidates the student's previous active session.
    """
    # Device 1: Login from Chrome on Windows
    res1 = client.post("/api/auth/login", json={
        "email": "student1@test.com",
        "password": "StudentPass123!"
    }, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0"})
    assert res1.status_code == 200
    token1 = res1.get_json()["token"]

    # Device 1 can successfully access protected dashboard
    dash1 = client.get("/api/student/dashboard", headers={"Authorization": f"Bearer {token1}"})
    assert dash1.status_code == 200

    # Device 2: Same student logs in from Safari on iPhone
    res2 = client.post("/api/auth/login", json={
        "email": "student1@test.com",
        "password": "StudentPass123!"
    }, headers={"User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"})
    assert res2.status_code == 200
    token2 = res2.get_json()["token"]

    # Device 1 attempts to make a request -> MUST BE INVALIDATED
    dash1_retry = client.get("/api/student/dashboard", headers={"Authorization": f"Bearer {token1}"})
    assert dash1_retry.status_code == 401
    assert dash1_retry.get_json()["error"] == "SESSION_TERMINATED"
    assert "another device" in dash1_retry.get_json()["message"].lower()

    # Device 2 request succeeds
    dash2 = client.get("/api/student/dashboard", headers={"Authorization": f"Bearer {token2}"})
    assert dash2.status_code == 200


def test_generic_password_reset_response(client):
    """
    Security requirement: Generic password-reset responses that do not disclose whether an account exists.
    """
    # Non-existent email
    res1 = client.post("/api/auth/forgot-password", json={"email": "nonexistent_email_12345@test.com"})
    assert res1.status_code == 200
    assert "instructions" in res1.get_json()["message"].lower()

    # Existent email
    res2 = client.post("/api/auth/forgot-password", json={"email": "student1@test.com"})
    assert res2.status_code == 200
    assert res2.get_json()["message"] == res1.get_json()["message"]
