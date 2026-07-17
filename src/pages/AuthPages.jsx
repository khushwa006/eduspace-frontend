import { useState, useEffect } from 'react';
import PasswordStrength, { isPasswordValid } from '../components/PasswordStrength';
import '../components/PasswordStrength.css';
import { authAPI } from '../services/api';
import './AuthPages.css';

export default function AuthPages({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loginRole, setLoginRole] = useState('Student'); // purely cosmetic — actual role comes from the backend
  // ✅ Fix: removed hardcoded default credentials — user must type their own
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Added confirm password state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('Student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── 2FA OTP STATE ──────────────────────────────────────────
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [preAuthToken, setPreAuthToken] = useState('');
  const [otpInfo, setOtpInfo] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [pendingRole, setPendingRole] = useState('');

  // ── REGISTRATION: SECURITY QUESTION ───────────────────────
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  useEffect(() => {
    authAPI.getSecurityQuestions()
      .then(res => setSecurityQuestions(res.questions || []))
      .catch(() => {});
  }, []);

  // ── FORGOT PASSWORD FLOW ───────────────────────────────────
  const [fpStep, setFpStep] = useState(null); // null | 'email' | 'question' | 'reset' | 'done'
  const [fpEmail, setFpEmail] = useState('');
  const [fpQuestion, setFpQuestion] = useState('');
  const [fpAnswer, setFpAnswer] = useState('');
  const [fpResetToken, setFpResetToken] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpError, setFpError] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpCooldown, setFpCooldown] = useState(0);
  const [fpLocked, setFpLocked] = useState(false);

  useEffect(() => {
    if (fpCooldown <= 0) return;
    const timer = setInterval(() => {
      setFpCooldown(s => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [fpCooldown]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(email, password);

      // ── 2FA: backend asks for an OTP before issuing the real token ──
      if (response && response.requires_2fa) {
        setPreAuthToken(response.pre_auth_token);
        setOtpInfo(response.message || `A 6-digit code has been sent to ${email}`);
        setOtpError('');
        setOtpCode('');
        setOtpStep(true);
        setLoading(false);
        return;
      }

      // ✅ Fix: backend returns 'token', not 'access_token'
      const actualRole = response.user.role;
      if (actualRole.toLowerCase() !== loginRole.toLowerCase()) {
        setError(`This account is registered as ${actualRole}. Please switch to the "${actualRole}" tab above and try again.`);
        setLoading(false);
        return;
      }

      localStorage.setItem('jwt_token', response.token);
      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('userName', response.user.email);

      onLogin(response.user.role);
    } catch (err) {
      // ✅ Now error shows properly instead of fast-redirect
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setOtpError('Please enter the 6-digit code');
      return;
    }
    setOtpLoading(true);
    try {
      const response = await authAPI.verifyOtp(preAuthToken, otpCode.trim());

      const actualRole = response.user.role;
      if (actualRole.toLowerCase() !== loginRole.toLowerCase()) {
        setOtpError(`This account is registered as ${actualRole}. Please go back, switch to the "${actualRole}" tab, and log in again.`);
        setOtpLoading(false);
        return;
      }

      localStorage.setItem('jwt_token', response.token);
      localStorage.setItem('userRole', response.user.role);
      localStorage.setItem('userName', response.user.email);

      onLogin(response.user.role);
    } catch (err) {
      setOtpError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    setOtpError('');
    try {
      const response = await authAPI.resendOtp(preAuthToken);
      setOtpInfo(response.message || 'A new code has been sent.');
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown(c => {
          if (c <= 1) { clearInterval(timer); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (err) {
      setOtpError(err.message || 'This login attempt expired. Please log in again.');
      setOtpStep(false);
    } finally {
      setResendLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setOtpStep(false);
    setOtpCode('');
    setOtpError('');
    setOtpInfo('');
    setPreAuthToken('');
    setPassword('');
  };

  const resetForgotPasswordFlow = () => {
    setFpStep(null);
    setFpEmail('');
    setFpQuestion('');
    setFpAnswer('');
    setFpResetToken('');
    setFpNewPassword('');
    setFpConfirmPassword('');
    setFpError('');
    setFpCooldown(0);
    setFpLocked(false);
  };

  const handleFpRequestQuestion = async (e) => {
    e.preventDefault();
    setFpError('');
    if (!fpEmail.trim()) { setFpError('Please enter your email'); return; }
    setFpLoading(true);
    try {
      const res = await authAPI.forgotPasswordGetQuestion(fpEmail.trim());
      setFpQuestion(res.security_question);
      setFpStep('question');
    } catch (err) {
      if (err.status === 403) {
        setFpLocked(true);
      } else if (err.cooldown_seconds) {
        setFpCooldown(err.cooldown_seconds);
      }
      setFpError(err.message || 'No account found with this email.');
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpVerifyAnswer = async (e) => {
    e.preventDefault();
    setFpError('');
    if (!fpAnswer.trim()) { setFpError('Please enter your answer'); return; }
    setFpLoading(true);
    try {
      const res = await authAPI.forgotPasswordVerifyAnswer(fpEmail.trim(), fpAnswer.trim());
      setFpResetToken(res.reset_token);
      setFpStep('reset');
    } catch (err) {
      if (err.status === 403) {
        setFpLocked(true);
      } else if (err.cooldown_seconds) {
        setFpCooldown(err.cooldown_seconds);
      }
      setFpError(err.message || 'Incorrect answer. Please try again.');
      setFpAnswer('');
    } finally {
      setFpLoading(false);
    }
  };

  const handleFpResetPassword = async (e) => {
    e.preventDefault();
    setFpError('');
    if (fpNewPassword !== fpConfirmPassword) { setFpError('Passwords do not match.'); return; }
    if (!isPasswordValid(fpNewPassword)) { setFpError('Please choose a stronger password that meets all requirements.'); return; }
    setFpLoading(true);
    try {
      await authAPI.forgotPasswordReset(fpResetToken, fpNewPassword);
      setFpStep('done');
    } catch (err) {
      setFpError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setFpLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if passwords match
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }

      if (!isPasswordValid(password)) {
        setError('Please choose a stronger password that meets all requirements.');
        setLoading(false);
        return;
      }

      if (!securityQuestion) {
        setError('Please select a security question.');
        setLoading(false);
        return;
      }

      if (!securityAnswer.trim()) {
        setError('Please provide an answer to your security question.');
        setLoading(false);
        return;
      }

      const res = await authAPI.register(email, password, firstName, lastName, role, securityQuestion, securityAnswer);
      setEmail('');
      setPassword('');
      setConfirmPassword(''); // Reset confirm field
      setFirstName('');
      setLastName('');
      setSecurityQuestion('');
      setSecurityAnswer('');
      if (res && res.pending) {
        setError('');
        setIsLogin(true);
        alert(`✅ Registration submitted! Your ${res.role ? res.role.charAt(0).toUpperCase() + res.role.slice(1) : ''} account is pending admin approval. You will receive access once an admin approves your account.`);
      } else {
        setError('');
        setIsLogin(true);
        alert('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>EduSpace Manager</h1>

        {fpLocked ? (
          <div>
            <h2>🔒 Account Locked</h2>
            <div className="error-message">
              Too many failed attempts. This account is locked for security.
            </div>
            <p style={{ fontSize: '14px', color: '#334155', margin: '14px 0 18px', lineHeight: 1.6 }}>
              Please contact your <strong>admin</strong> to have your password reset manually.
              An alert has already been sent to the account's email.
            </p>
            <button type="button" onClick={resetForgotPasswordFlow}>
              Back to Login
            </button>
          </div>
        ) : fpStep === 'email' ? (
          <form onSubmit={handleFpRequestQuestion}>
            <h2>🔑 Forgot Password</h2>
            {fpError && <div className="error-message">{fpError}</div>}
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px' }}>
              Enter your account email and we'll show you your security question.
            </p>
            <input
              type="email"
              placeholder="Email"
              value={fpEmail}
              onChange={(e) => setFpEmail(e.target.value)}
              required
              autoFocus
              disabled={fpCooldown > 0}
            />
            <button type="submit" disabled={fpLoading || fpCooldown > 0}>
              {fpCooldown > 0 ? `Try again in ${fpCooldown}s` : (fpLoading ? 'Checking...' : 'Continue')}
            </button>
            <p>
              <button type="button" onClick={resetForgotPasswordFlow} className="link-button">
                ← Back to login
              </button>
            </p>
          </form>
        ) : fpStep === 'question' ? (
          <form onSubmit={handleFpVerifyAnswer}>
            <h2>🔑 Security Question</h2>
            {fpError && <div className="error-message">{fpError}</div>}
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155', margin: '0 0 14px' }}>
              {fpQuestion}
            </p>
            <input
              type="text"
              placeholder="Your answer"
              value={fpAnswer}
              onChange={(e) => setFpAnswer(e.target.value)}
              required
              autoFocus
              disabled={fpCooldown > 0}
            />
            <button type="submit" disabled={fpLoading || fpCooldown > 0}>
              {fpCooldown > 0 ? `Try again in ${fpCooldown}s` : (fpLoading ? 'Verifying...' : 'Verify Answer')}
            </button>
            <p>
              <button type="button" onClick={resetForgotPasswordFlow} className="link-button">
                ← Back to login
              </button>
            </p>
          </form>
        ) : fpStep === 'reset' ? (
          <form onSubmit={handleFpResetPassword}>
            <h2>🔑 Set New Password</h2>
            {fpError && <div className="error-message">{fpError}</div>}
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="New Password"
                value={fpNewPassword}
                onChange={(e) => setFpNewPassword(e.target.value)}
                required
                style={{ width: '100%', paddingRight: '44px', boxSizing: 'border-box' }}
                autoFocus
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', fontSize:'16px', color:'#64748b' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <PasswordStrength password={fpNewPassword} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm New Password"
              value={fpConfirmPassword}
              onChange={(e) => setFpConfirmPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={fpLoading}>
              {fpLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : fpStep === 'done' ? (
          <div>
            <h2>✅ Password Reset!</h2>
            <p style={{ fontSize: '14px', color: '#334155', margin: '0 0 18px', lineHeight: 1.6 }}>
              Your password has been changed successfully. You can now log in with your new password.
            </p>
            <button type="button" onClick={() => { resetForgotPasswordFlow(); setIsLogin(true); }}>
              Back to Login
            </button>
          </div>
        ) : otpStep ? (
          <form onSubmit={handleVerifyOtp}>
            <h2>🔐 Verify Your Identity</h2>
            {otpError && <div className="error-message">{otpError}</div>}
            {otpInfo && !otpError && (
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px', lineHeight: 1.5 }}>
                {otpInfo}
              </p>
            )}

            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              value={otpCode}
              maxLength={6}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, letterSpacing: '8px' }}
              autoFocus
              required
            />

            <button type="submit" disabled={otpLoading}>
              {otpLoading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <p style={{ textAlign: 'center', margin: '10px 0' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendLoading || resendCooldown > 0}
                className="link-button"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : (resendLoading ? 'Sending...' : 'Resend Code')}
              </button>
            </p>

            <p>
              <button type="button" onClick={handleBackToLogin} className="link-button">
                ← Back to login
              </button>
            </p>
          </form>
        ) : isLogin ? (
          <form onSubmit={handleLogin}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', background: '#0f172a', borderRadius: '10px', padding: '4px' }}>
              {['Student', 'Faculty', 'Admin'].map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setLoginRole(r)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                    fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                    background: loginRole === r ? '#3b82f6' : 'transparent',
                    color: loginRole === r ? '#fff' : '#64748b'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <h2>{loginRole} Login</h2>
            {error && <div className="error-message">{error}</div>}

            <input
              type="email"
              placeholder="Email (e.g. you@campus.edu)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', paddingRight: '44px', boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', fontSize:'16px', color:'#64748b' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <p style={{ textAlign: 'center', margin: '10px 0' }}>
              <button type="button" onClick={() => { setFpStep('email'); setFpEmail(email); setError(''); }} className="link-button">
                Forgot Password?
              </button>
            </p>

            <p>
              Don't have an account?{' '}
              <button type="button" onClick={() => { setIsLogin(false); setError(''); }} className="link-button">
                Register here
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <h2>Register</h2>
            {error && <div className="error-message">{error}</div>}

            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', paddingRight: '44px', boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', fontSize:'16px', color:'#64748b' }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Render the password requirements checklist dynamically here */}
            <PasswordStrength password={password} />

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={{ width: '100%', paddingRight: '44px', boxSizing: 'border-box' }}
              />
            </div>

            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option>Student</option>
              <option>Faculty</option>
              {/* Admin accounts are created by system only */}
            </select>

            <select value={securityQuestion} onChange={(e) => setSecurityQuestion(e.target.value)} required>
              <option value="">Select a security question...</option>
              {securityQuestions.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <input
              type="text"
              placeholder="Your answer (for password recovery)"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              required
            />
            <p style={{ fontSize: '12px', color: '#64748b', margin: '-4px 0 4px' }}>
              🔒 We'll ask this if you ever forget your password.
            </p>

            <button type="submit" disabled={loading}>
              {loading ? 'Registering...' : 'Register'}
            </button>

            <p>
              Already have an account?{' '}
              <button type="button" onClick={() => { setIsLogin(true); setError(''); }} className="link-button">
                Login here
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
