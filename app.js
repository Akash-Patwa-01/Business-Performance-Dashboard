/* ============================================================
   SUPABASE AUTH: EMAIL/PASSWORD + EMAIL OTP VERIFICATION + PASSWORD RESET
   ============================================================ */
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY';

// Demo admin account: admin can log in directly without email verification.
// For a production application, move admin authentication to a secure backend.
const ADMIN_EMAIL = 'admin@pulse.demo';
const ADMIN_PASSWORD = 'admin123';
const supabaseClient = (SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('YOUR_SUPABASE') && !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE'))
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const loginScreen = document.getElementById('login-screen');
const appScreen = document.getElementById('app-screen');
let pendingSignupEmail = '';
let pendingResetEmail = '';
let passwordRecoverySession = false;

const authPanels = {
  login: document.getElementById('login-panel'), signup: document.getElementById('signup-panel'),
  verify: document.getElementById('verify-panel'), forgot: document.getElementById('forgot-panel'),
  resetOtp: document.getElementById('reset-otp-panel'), newPassword: document.getElementById('new-password-panel')
};
function authConfigured(){ return SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('YOUR_SUPABASE') && !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE'); }
function setAuthMode(mode){
  Object.values(authPanels).forEach(p=>p.classList.remove('active')); authPanels[mode].classList.add('active');
  const tabs=document.getElementById('auth-tabs'); tabs.style.display=['login','signup'].includes(mode)?'flex':'none';
  document.getElementById('tab-login').classList.toggle('active',mode==='login'); document.getElementById('tab-signup').classList.toggle('active',mode==='signup');
  const titles={login:['Sign in','Internal performance reporting'],signup:['Create account','Verify your email before accessing the dashboard'],verify:['Verify email','Confirm your email address'],forgot:['Forgot password','We will send a verification code to your email'],resetOtp:['Verify reset code','Confirm your identity before changing the password'],newPassword:['Create new password','Choose a new password for your account']};
  document.getElementById('auth-title').textContent=titles[mode][0]; document.getElementById('auth-subtitle').textContent=titles[mode][1];
  document.querySelectorAll('.login-error,.login-success').forEach(el=>el.textContent='');
}
function showApp(user){ loginScreen.style.display='none'; appScreen.style.display='block'; document.getElementById('user-label').textContent='Signed in as '+(user?.user_metadata?.full_name||user?.email||'User'); }
function showLogin(){ appScreen.style.display='none'; loginScreen.style.display='flex'; setAuthMode('login'); }
function validEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function validPassword(p){ return typeof p==='string' && p.length>=8; }
function friendlyAuthError(error){
  const m=error?.message||'Something went wrong. Please try again.', l=m.toLowerCase();
  if(l.includes('invalid login credentials')) return 'Incorrect email or password.';
  if(l.includes('user already registered')) return 'An account with this email already exists. Try signing in.';
  if(l.includes('email not confirmed')) return 'Please verify your email with the OTP before signing in.';
  if(l.includes('token has expired')||l.includes('otp_expired')) return 'That OTP has expired. Please request a new one.';
  if(l.includes('invalid')&&l.includes('otp')) return 'Invalid OTP. Check the code and try again.';
  return m;
}
function setLoading(id,on,busy,normal){ const b=document.getElementById(id); b.disabled=on; b.textContent=on?busy:normal; b.style.opacity=on?'.65':'1'; }

document.querySelectorAll('.pw-toggle').forEach(btn=>btn.addEventListener('click',()=>{const i=document.getElementById(btn.dataset.target);const v=i.type==='password';i.type=v?'text':'password';btn.textContent=v?'Hide':'Show';}));
document.getElementById('tab-login').addEventListener('click',()=>setAuthMode('login'));
document.getElementById('tab-signup').addEventListener('click',()=>setAuthMode('signup'));
document.getElementById('back-to-login').addEventListener('click',e=>{e.preventDefault();setAuthMode('login');});
document.getElementById('forgot-back-login').addEventListener('click',e=>{e.preventDefault();setAuthMode('login');});
document.getElementById('forgot-password-link').addEventListener('click',e=>{e.preventDefault();document.getElementById('forgot-email').value=document.getElementById('login-email').value.trim();setAuthMode('forgot');});
document.getElementById('logout-btn').addEventListener('click',async()=>{sessionStorage.removeItem('pulse_admin_session');sessionStorage.removeItem('pulse_admin_email');if(supabaseClient) await supabaseClient.auth.signOut(); location.reload();});

// Existing users: email + password login.
document.getElementById('login-form').addEventListener('submit',async e=>{
  e.preventDefault(); const err=document.getElementById('login-error'); err.textContent='';
  const email=document.getElementById('login-email').value.trim().toLowerCase(), password=document.getElementById('login-password').value;
  if(!validEmail(email)||!password){err.textContent='Enter a valid email and password.';return;}

  // Admin login is intentionally handled locally for this static technical-assignment demo.
  // Unlike normal users, the admin does not require email verification.
  if(email===ADMIN_EMAIL && password===ADMIN_PASSWORD){
    sessionStorage.setItem('pulse_admin_session','true');
    sessionStorage.setItem('pulse_admin_email',ADMIN_EMAIL);
    showApp({email:ADMIN_EMAIL,user_metadata:{full_name:'Admin'}});
    return;
  }

  if(!authConfigured()){err.textContent='Supabase is not configured. Add your project URL and publishable/anon key in index.html.';return;}
  setLoading('login-submit',true,'Signing in…','Sign in'); const {data,error}=await supabaseClient.auth.signInWithPassword({email,password}); setLoading('login-submit',false,'','Sign in');
  if(error){err.textContent=friendlyAuthError(error);return;} showApp(data.user);
});

// New user: create account -> email OTP -> authenticated session.
document.getElementById('signup-form').addEventListener('submit',async e=>{
  e.preventDefault(); const err=document.getElementById('signup-error'); err.textContent='';
  if(!authConfigured()){err.textContent='Supabase is not configured yet.';return;}
  const name=document.getElementById('signup-name').value.trim(), email=document.getElementById('signup-email').value.trim().toLowerCase(), password=document.getElementById('signup-password').value, confirm=document.getElementById('signup-confirm').value;
  if(email===ADMIN_EMAIL){err.textContent='That email is reserved for the administrator.';return;}
  if(!name||!validEmail(email)){err.textContent='Enter your name and a valid email address.';return;}
  if(!validPassword(password)){err.textContent='Password must be at least 8 characters.';return;}
  if(password!==confirm){err.textContent='Passwords do not match.';return;}
  setLoading('signup-submit',true,'Creating account…','Create account');
  const {data,error}=await supabaseClient.auth.signUp({email,password,options:{data:{full_name:name}}});
  setLoading('signup-submit',false,'','Create account');
  if(error){err.textContent=friendlyAuthError(error);return;}
  pendingSignupEmail=email; document.getElementById('verify-email-label').textContent=email; document.getElementById('verify-otp').value=''; setAuthMode('verify'); document.getElementById('verify-success').textContent='Verification code sent. Check your inbox.';
  if(data.session&&data.user?.email_confirmed_at) showApp(data.user);
});

// Verify signup email OTP.
document.getElementById('verify-form').addEventListener('submit',async e=>{
  e.preventDefault(); const err=document.getElementById('verify-error'), ok=document.getElementById('verify-success'); err.textContent=''; ok.textContent=''; const token=document.getElementById('verify-otp').value.trim();
  if(!/^\d{6}$/.test(token)){err.textContent='Enter the 6-digit OTP from your email.';return;}
  setLoading('verify-submit',true,'Verifying…','Verify email'); const {data,error}=await supabaseClient.auth.verifyOtp({email:pendingSignupEmail,token,type:'signup'}); setLoading('verify-submit',false,'','Verify email');
  if(error){err.textContent=friendlyAuthError(error);return;} ok.textContent='Email verified successfully. Signing you in…'; setTimeout(()=>showApp(data.user),350);
});
document.getElementById('resend-signup-otp').addEventListener('click',async()=>{const e=document.getElementById('verify-error'),o=document.getElementById('verify-success');e.textContent='';o.textContent='';if(!pendingSignupEmail){e.textContent='No signup email is pending.';return;}const {error}=await supabaseClient.auth.resend({type:'email',email:pendingSignupEmail});if(error)e.textContent=friendlyAuthError(error);else o.textContent='A new verification OTP has been sent.';});

// Password reset: email -> recovery OTP -> new password.
document.getElementById('forgot-form').addEventListener('submit',async e=>{
  e.preventDefault(); const err=document.getElementById('forgot-error');err.textContent='';document.getElementById('forgot-success').textContent='';
  if(!authConfigured()){err.textContent='Supabase is not configured yet.';return;}
  const email=document.getElementById('forgot-email').value.trim().toLowerCase(); if(!validEmail(email)){err.textContent='Enter a valid account email.';return;}
  setLoading('forgot-submit',true,'Sending…','Send reset OTP'); const {error}=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+window.location.pathname}); setLoading('forgot-submit',false,'','Send reset OTP');
  if(error){err.textContent=friendlyAuthError(error);return;} pendingResetEmail=email;document.getElementById('reset-email-label').textContent=email;document.getElementById('reset-otp').value='';setAuthMode('resetOtp');
});
document.getElementById('reset-otp-form').addEventListener('submit',async e=>{
  e.preventDefault(); const err=document.getElementById('reset-otp-error');err.textContent='';const token=document.getElementById('reset-otp').value.trim();if(!/^\d{6}$/.test(token)){err.textContent='Enter the 6-digit OTP from your email.';return;}
  setLoading('reset-otp-submit',true,'Verifying…','Verify code'); const {data,error}=await supabaseClient.auth.verifyOtp({email:pendingResetEmail,token,type:'recovery'});setLoading('reset-otp-submit',false,'','Verify code');
  if(error){err.textContent=friendlyAuthError(error);return;} passwordRecoverySession=!!data.session;setAuthMode('newPassword');
});
document.getElementById('resend-reset-otp').addEventListener('click',async()=>{const err=document.getElementById('reset-otp-error');err.textContent='';if(!pendingResetEmail){err.textContent='No reset email is pending.';return;}const {error}=await supabaseClient.auth.resetPasswordForEmail(pendingResetEmail,{redirectTo:window.location.origin+window.location.pathname});if(error)err.textContent=friendlyAuthError(error);else err.textContent='A new reset OTP has been sent.';});
document.getElementById('new-password-form').addEventListener('submit',async e=>{
  e.preventDefault();const err=document.getElementById('new-password-error'),ok=document.getElementById('new-password-success');err.textContent='';ok.textContent='';const password=document.getElementById('new-password').value,confirm=document.getElementById('new-password-confirm').value;
  if(!validPassword(password)){err.textContent='Password must be at least 8 characters.';return;}if(password!==confirm){err.textContent='Passwords do not match.';return;}if(!passwordRecoverySession){err.textContent='Password reset session is missing. Start again.';return;}
  setLoading('new-password-submit',true,'Updating…','Set new password');const {data,error}=await supabaseClient.auth.updateUser({password});setLoading('new-password-submit',false,'','Set new password');if(error){err.textContent=friendlyAuthError(error);return;}ok.textContent='Password updated successfully. Signing you in…';setTimeout(()=>showApp(data.user),500);
});

async function initAuth(){
  if(sessionStorage.getItem('pulse_admin_session')==='true'){
    showApp({email:ADMIN_EMAIL,user_metadata:{full_name:'Admin'}});
    return;
  }
  if(!authConfigured()){document.getElementById('auth-config-hint').innerHTML='<strong>Setup required:</strong> create a Supabase project, enable email authentication, then replace the two Supabase placeholders in this file. Demo admin login is available without Supabase.';showLogin();return;}
  const {data:{session}}=await supabaseClient.auth.getSession(); if(session?.user)showApp(session.user);else showLogin();
  supabaseClient.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT')showLogin();});
}
initAuth();

/* ============================================================
   CSV HANDLING + VALIDATION
   ============================================================ */
const REQUIRED_COLUMNS = ['Date','Leads','Calls','Visits','Revenue','Conversions'];

let currentData = null;   // aggregated totals for current period
let previousData = null;  // aggregated totals for previous period
let chartInstance = null;

function setStatus(el, msg, isError){
  el.textContent = msg;
  el.classList.toggle('err', !!isError);
}

function showAlert(msg, type){
  const banner = document.getElementById('alert-banner');
  banner.textContent = msg;
  banner.className = 'alert-banner' + (type === 'warn' ? ' warn' : '');
  banner.style.display = 'block';
}
function clearAlert(){
  const banner = document.getElementById('alert-banner');
  banner.style.display = 'none';
  banner.textContent = '';
}

/**
 * Parses + validates a CSV file, returns aggregated totals.
 * Throws an Error with a human-readable message on hard failures
 * (empty file, missing required columns, no valid rows at all).
 * Returns {totals, skippedRows} on success (skippedRows counts
 * rows dropped due to missing/invalid values).
 */
function parseAndAggregate(file){
  return new Promise((resolve, reject) => {
    if(!file){
      reject(new Error('No file selected.'));
      return;
    }
    if(!file.name.toLowerCase().endsWith('.csv')){
      reject(new Error('"' + file.name + '" is not a .csv file.'));
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results){
        try{
          const rows = results.data;

          if(!rows || rows.length === 0){
            reject(new Error('The uploaded file is empty — no data rows found.'));
            return;
          }

          const headers = results.meta.fields || [];
          const missing = REQUIRED_COLUMNS.filter(c => !headers.includes(c));
          if(missing.length > 0){
            reject(new Error('CSV is missing required column(s): ' + missing.join(', ') +
              '. Expected: Date, Leads, Calls, Visits, Revenue, Conversions.'));
            return;
          }

          let totals = { Leads:0, Calls:0, Visits:0, Revenue:0, Conversions:0 };
          let validRows = 0;
          let skippedRows = 0;
            rows.forEach(row => {
              let rowValid = true;
              let parsedVals = {};

              const dateRaw = row.Date;
              if(dateRaw === undefined || dateRaw === null || String(dateRaw).trim() === '' || Number.isNaN(Date.parse(String(dateRaw).trim()))) {
                rowValid = false;
              }

              ['Leads','Calls','Visits','Revenue','Conversions'].forEach(col => {
                const raw = row[col];
                if(raw === undefined || raw === null || String(raw).trim() === '') {
                  rowValid = false;
                  return;
                }
                const num = Number(String(raw).replace(/,/g,'').trim());
                if(Number.isNaN(num)) {
                  rowValid = false;
                  return;
                }
                parsedVals[col] = num;
              });

              if(rowValid) {
                ['Leads','Calls','Visits','Revenue','Conversions'].forEach(col => totals[col] += parsedVals[col]);
                validRows++;
              } else {
                skippedRows++;
              }
            });

            if(validRows === 0){
            reject(new Error('No valid rows could be read — check Date plus Leads, Calls, Visits, Revenue and Conversions.'));
            return;
          }

          const conversionRate = totals.Leads > 0 ? (totals.Conversions / totals.Leads) * 100 : 0;

          resolve({
            totals: {
              Leads: totals.Leads,
              Calls: totals.Calls,
              Visits: totals.Visits,
              Revenue: totals.Revenue,
              ConversionRate: conversionRate
            },
            validRows,
            skippedRows
          });
        } catch(err){
          reject(new Error('Could not process this CSV — please check the file and try again.'));
        }
      },
      error: function(){
        reject(new Error('The file could not be parsed as CSV.'));
      }
    });
  });
}

document.getElementById('file-current').addEventListener('change', function(e){
  handleUpload(e.target.files[0], 'current');
});
document.getElementById('file-previous').addEventListener('change', function(e){
  handleUpload(e.target.files[0], 'previous');
});

function handleUpload(file, slot){
  const statusEl = document.getElementById('status-' + slot);
  clearAlert();
  setStatus(statusEl, 'Reading...', false);

  parseAndAggregate(file).then(result => {
    if(slot === 'current'){ currentData = result.totals; }
    else { previousData = result.totals; }

    let msg = result.validRows + ' row(s) processed.';
    if(result.skippedRows > 0){
      msg += ' ' + result.skippedRows + ' row(s) skipped.';
      showAlert('Heads up: ' + result.skippedRows + ' row(s) in "' + file.name +
        '" were skipped due to missing or non-numeric values. Totals reflect the remaining valid rows.', 'warn');
    }
    setStatus(statusEl, msg, false);
    renderAll();
  }).catch(err => {
    setStatus(statusEl, 'Error: ' + err.message, true);
    showAlert(err.message, 'error');
    if(slot === 'current'){ currentData = null; }
    else { previousData = null; }
    renderAll();
  });
}

/* ============================================================
   RENDERING
   ============================================================ */
function formatNumber(n){
  return Math.round(n).toLocaleString('en-US');
}
function formatCurrency(n){
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
function formatPct(n){
  return n.toFixed(1) + '%';
}
function pctChange(curr, prev){
  if(prev === 0){ return curr === 0 ? 0 : null; } // null = undefined change (avoid div by zero)
  return ((curr - prev) / prev) * 100;
}
function deltaClass(change){
  if(change === null) return 'flat';
  if(change > 0.05) return 'up';
  if(change < -0.05) return 'down';
  return 'flat';
}
function deltaLabel(change){
  if(change === null) return 'n/a (no prior data)';
  const sign = change > 0 ? '+' : '';
  return sign + change.toFixed(1) + '% vs previous';
}

function renderAll(){
  renderMetrics();
  renderComparison();
  renderChart();
  renderInsights();
}

function renderMetrics(){
  const grid = document.getElementById('metrics-grid');
  const empty = document.getElementById('metrics-empty');

  if(!currentData){
    grid.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  grid.style.display = 'grid';

  const cards = [
    { label:'Total Leads', value: formatNumber(currentData.Leads), key:'Leads' },
    { label:'Total Calls', value: formatNumber(currentData.Calls), key:'
