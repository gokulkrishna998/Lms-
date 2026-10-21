import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, AlertCircle, ShieldCheck, X, Loader2, CreditCard, ExternalLink } from "lucide-react";
import { paymentsApi } from "../../api/endpoints";
import { formatCurrency } from "../../utils/formatters";
import { useToast } from "../../context/ToastContext";

export const PaymentModal = ({ orderData, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!isOpen || !orderData) return null;

  const handleTestSandboxPayment = async (simulateSuccess = true) => {
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!simulateSuccess) {
        // Simulate a failed transaction
        setErrorMsg("Payment was declined or cancelled by the gateway. No funds were debited.");
        setLoading(false);
        return;
      }

      // Send payment verification to backend
      const payload = {
        order_id: orderData.order_id,
        razorpay_order_id: orderData.razorpay_order_id,
        razorpay_payment_id: `pay_test_${Date.now().toString(36)}`,
        razorpay_signature: "simulated_sig_success",
      };

      const res = await paymentsApi.verifyPayment(payload);
      setSuccessData(res.data);
      showToast("Payment verified! Course access activated.", "success");
    } catch (err) {
      console.error("Verification failed:", err);
      const msg = err.response?.data?.message || "Payment verification failed. Please try again.";
      setErrorMsg(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchRazorpayStandard = () => {
    // Check if official Razorpay checkout script is loaded in window
    if (typeof window !== "undefined" && window.Razorpay) {
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency || "INR",
        name: "MiniLMS Learning Platform",
        description: `Enrollment in ${orderData.course?.title}`,
        image: orderData.course?.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
        order_id: orderData.razorpay_order_id,
        prefill: {
          name: orderData.user?.name,
          email: orderData.user?.email,
        },
        theme: {
          color: "#2563eb",
        },
        handler: async function (response) {
          setLoading(true);
          try {
            const verifyPayload = {
              order_id: orderData.order_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            };
            const res = await paymentsApi.verifyPayment(verifyPayload);
            setSuccessData(res.data);
            showToast("Payment verified! Enrollment confirmed.", "success");
          } catch (err) {
            setErrorMsg(err.response?.data?.message || "Payment signature check failed.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setErrorMsg("Payment window closed by user.");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setErrorMsg(`Payment Failed: ${response.error.description}`);
      });
      rzp.open();
    } else {
      // Fallback to test sandbox mode
      handleTestSandboxPayment(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-scale-up">
        {/* Close button */}
        {!loading && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {successData ? (
          /* Payment Confirmed State */
          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900">Payment Successful!</h3>
            <p className="text-sm text-slate-600">
              You are now enrolled in{" "}
              <span className="font-semibold text-slate-800">{orderData.course?.title}</span>.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Order Reference:</span>
                <span className="font-mono font-medium text-slate-900">{orderData.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(orderData.amount_paise)}</span>
              </div>
              <div className="flex justify-between">
                <span>Access Granted:</span>
                <span className="text-emerald-700 font-medium">Immediate Lifetime Access</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate(`/learning/${orderData.course?.slug || successData.course_slug}`)}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
              >
                Start Learning Now
              </button>
              <button
                onClick={() => navigate("/student/courses")}
                className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all"
              >
                Go to My Courses
              </button>
            </div>
          </div>
        ) : (
          /* Checkout Payment Initiation State */
          <div className="space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
                <CreditCard className="w-3.5 h-3.5" />
                Razorpay Checkout (Test Mode)
              </div>
              <h3 className="text-xl font-bold text-slate-900">Confirm Course Purchase</h3>
              <p className="text-xs text-slate-500 mt-1">
                Order ID: <span className="font-mono text-slate-700">{orderData.order_number}</span>
              </p>
            </div>

            {/* Course Summary */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <img
                src={
                  orderData.course?.thumbnail_url ||
                  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80"
                }
                alt={orderData.course?.title}
                className="w-16 h-16 rounded-lg object-cover border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900 text-sm truncate">{orderData.course?.title}</h4>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    {formatCurrency(orderData.amount_paise)}
                  </span>
                  <span className="text-xs text-slate-400">Total payable</span>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Security Notice */}
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Payments are encrypted & verified server-side with HMAC-SHA256.</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleLaunchRazorpayStandard}
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying Payment...
                  </>
                ) : (
                  <>
                    Pay {formatCurrency(orderData.amount_paise)} via Razorpay
                  </>
                )}
              </button>

              {/* Developer / Sandbox Mode testing controls */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Sandbox Test Actions:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestSandboxPayment(true)}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                  >
                    Simulate Success
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => handleTestSandboxPayment(false)}
                    disabled={loading}
                    className="text-rose-600 hover:text-rose-800 font-medium underline"
                  >
                    Simulate Fail
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
