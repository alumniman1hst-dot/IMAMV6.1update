
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React, { Suspense, useState, useEffect } from 'react';
const Login = React.lazy(() => import('./Login'));
const Register = React.lazy(() => import('./Register'));
const Dashboard = React.lazy(() => import('./Dashboard'));
const Presensi = React.lazy(() => import('./Presensi'));
const ContentGeneration = React.lazy(() => import('./ContentGeneration'));
const ClassList = React.lazy(() => import('./ClassList'));
const ClassPromotion = React.lazy(() => import('./ClassPromotion'));
const Schedule = React.lazy(() => import('./Schedule'));
import BottomNav from './BottomNav';
import Sidebar from './Sidebar';
const Profile = React.lazy(() => import('./Profile'));
const AcademicYear = React.lazy(() => import('./AcademicYear'));
const Reports = React.lazy(() => import('./Reports'));
const Advisor = React.lazy(() => import('./Advisor'));
const Settings = React.lazy(() => import('./Settings'));
const PointsView = React.lazy(() => import('./PointsView'));
import { ViewState, UserRole } from '../types';
import { normalizeRole, Role } from '../src/auth/roles';
import { hasPermission, Permission } from '../src/auth/rbac';
import { toast } from 'sonner';
import { Loader2, AppLogo } from './Icons';
import { auth, db, isMockMode } from '../services/firebase';

// Feature Views
const AllFeatures = React.lazy(() => import('./AllFeatures'));
const AttendanceHistory = React.lazy(() => import('./AttendanceHistory'));
const QRScanner = React.lazy(() => import('./QRScanner'));
const TeachingJournal = React.lazy(() => import('./TeachingJournal'));
const Assignments = React.lazy(() => import('./Assignments'));
const Grades = React.lazy(() => import('./Grades'));
const StudentData = React.lazy(() => import('./StudentData'));
const TeacherData = React.lazy(() => import('./TeacherData'));
const IDCard = React.lazy(() => import('./IDCard'));
const Letters = React.lazy(() => import('./Letters'));
const CreateAccount = React.lazy(() => import('./CreateAccount'));
const DeveloperConsole = React.lazy(() => import('./DeveloperConsole'));
const LoginHistory = React.lazy(() => import('./LoginHistory'));
const About = React.lazy(() => import('./About'));
const History = React.lazy(() => import('./History'));
const Premium = React.lazy(() => import('./Premium'));
const News = React.lazy(() => import('./News'));
const MadrasahInfo = React.lazy(() => import('./MadrasahInfo'));
const KemenagHub = React.lazy(() => import('./KemenagHub'));
const ClaimManagement = React.lazy(() => import('./ClaimManagement'));

const viewToPath: Partial<Record<ViewState, string>> = {
  [ViewState.LOGIN]: '/login',
  [ViewState.REGISTER]: '/register',
  [ViewState.DASHBOARD]: '/dashboard',
  [ViewState.PROFILE]: '/profile',
  [ViewState.SCHEDULE]: '/schedule',
  [ViewState.ALL_FEATURES]: '/features',
  [ViewState.NEWS]: '/news',
  [ViewState.ABOUT]: '/about',
  [ViewState.LOGIN_HISTORY]: '/login-history',
  [ViewState.ID_CARD]: '/id-card',
  [ViewState.HISTORY]: '/history',
  [ViewState.PREMIUM]: '/premium',
  [ViewState.ADVISOR]: '/advisor',
  [ViewState.MADRASAH_INFO]: '/madrasah-info',
  [ViewState.KEMENAG_HUB]: '/kemenag-hub',
  [ViewState.SETTINGS]: '/settings',
  [ViewState.CLASSES]: '/classes',
  [ViewState.PROMOTION]: '/promotion',
  [ViewState.ACADEMIC_YEAR]: '/academic-year',
  [ViewState.SCANNER]: '/scanner',
  [ViewState.ATTENDANCE_HISTORY]: '/attendance-history',
  [ViewState.PRESENSI]: '/presensi',
  [ViewState.CONTENT_GENERATION]: '/content-generation',
  [ViewState.REPORTS]: '/reports',
  [ViewState.JOURNAL]: '/journal',
  [ViewState.ASSIGNMENTS]: '/assignments',
  [ViewState.GRADES]: '/grades',
  [ViewState.REPORT_CARDS]: '/report-cards',
  [ViewState.STUDENTS]: '/students',
  [ViewState.TEACHERS]: '/teachers',
  [ViewState.LETTERS]: '/letters',
  [ViewState.POINTS]: '/points',
  [ViewState.CLAIM_MANAGEMENT]: '/claim-management',
  [ViewState.CREATE_ACCOUNT]: '/create-account',
  [ViewState.DEVELOPER]: '/developer'
};

const pathToView = Object.entries(viewToPath).reduce((acc, [view, path]) => {
  if (path) acc[path] = view as ViewState;
  return acc;
}, {} as Record<string, ViewState>);

const normalizePath = (pathname: string): string => {
  if (!pathname) return '/login';
  if (pathname === '/') return '/login';
  if (!pathname) return '/dashboard';
  if (pathname === '/') return '/dashboard';
  return pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
};

const getViewFromPath = (pathname: string): ViewState => {
  const normalized = normalizePath(pathname);
  return pathToView[normalized] || ViewState.LOGIN;
};

const getPathFromView = (view: ViewState): string => viewToPath[view] || '/login';

interface AppCurrentUser {
  uid: string;
  roles: UserRole[];
  school_id: string | null;
  status: string;
}

const VIEW_PERMISSIONS: Partial<Record<ViewState, Permission>> = {
  [ViewState.DASHBOARD]: Permission.VIEW_DASHBOARD,
  [ViewState.CLASSES]: Permission.MANAGE_ACADEMIC,
  [ViewState.PROMOTION]: Permission.MANAGE_ACADEMIC,
  [ViewState.SCHEDULE]: Permission.MANAGE_ACADEMIC,
  [ViewState.ACADEMIC_YEAR]: Permission.MANAGE_ACADEMIC,
  [ViewState.JOURNAL]: Permission.MANAGE_ACADEMIC,
  [ViewState.ASSIGNMENTS]: Permission.MANAGE_ACADEMIC,
  [ViewState.GRADES]: Permission.MANAGE_ACADEMIC,
  [ViewState.REPORT_CARDS]: Permission.MANAGE_ACADEMIC,
  [ViewState.SCANNER]: Permission.SCAN_QR,
  [ViewState.PRESENSI]: Permission.MANAGE_ATTENDANCE,
  [ViewState.ATTENDANCE_HISTORY]: Permission.VIEW_DASHBOARD,
  [ViewState.REPORTS]: Permission.VIEW_REPORTS,
  [ViewState.CONTENT_GENERATION]: Permission.ACCESS_AI,
  [ViewState.STUDENTS]: Permission.MANAGE_USERS,
  [ViewState.TEACHERS]: Permission.MANAGE_USERS,
  [ViewState.CREATE_ACCOUNT]: Permission.MANAGE_USERS,
  [ViewState.CLAIM_MANAGEMENT]: Permission.MANAGE_USERS,
  [ViewState.DEVELOPER]: Permission.MANAGE_SYSTEM,
};

const PUBLIC_VIEWS = new Set<ViewState>([ViewState.LOGIN, ViewState.REGISTER]);

const App: React.FC = () => {
  const viewFallback = (
    <div className="h-full w-full flex items-center justify-center bg-white dark:bg-[#020617]">
      <Loader2 className="w-7 h-7 text-indigo-500 animate-spin opacity-70" />
    </div>
  );

  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.TAMU);
  const [currentUser, setCurrentUser] = useState<AppCurrentUser | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewKey, setViewKey] = useState(0); 

  const canAccessView = (view: ViewState, user: AppCurrentUser | null): boolean => {
    if (PUBLIC_VIEWS.has(view)) return true;
    if (!user) return false;

    const isActive = String(user.status || '').toLowerCase() === 'active';
    if (!isActive) return false;
    if (!user.school_id && !user.roles.includes(Role.DEVELOPER)) return false;
    if (!user.roles.length) return false;

    if (view === ViewState.DEVELOPER) {
      return user.roles.includes(Role.DEVELOPER);
    }

    const neededPermission = VIEW_PERMISSIONS[view];
    if (!neededPermission) return true;

    return user.roles.some((role) => hasPermission(role, neededPermission));
  };

  const getSafeFallbackView = (user: AppCurrentUser | null): ViewState => {
    if (!user) return ViewState.LOGIN;
    return canAccessView(ViewState.DASHBOARD, user) ? ViewState.DASHBOARD : ViewState.LOGIN;
  };

  const enforceViewAccess = (requestedView: ViewState, user: AppCurrentUser | null, shouldNotify = true): ViewState => {
    if (canAccessView(requestedView, user)) return requestedView;
    if (shouldNotify) toast.error('Akses ditolak. Anda dialihkan ke halaman yang diizinkan.');
    return getSafeFallbackView(user);
  };

  useEffect(() => {
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
      
      setIsDarkTheme(shouldBeDark);
      if (shouldBeDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      
      const handleOnline = () => { setIsOnline(true); toast.success("Koneksi online."); };
      const handleOffline = () => { setIsOnline(false); toast.warning("Mode Offline Aktif."); };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      if (isMockMode) {
          setAuthLoading(false); 
      } else if (auth) {
          const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
              if (user && db) {
                  try {
                      const userRef = db.collection('users').doc(user.uid);
                      const userDoc = await userRef.get();
                      
                      if (userDoc.exists) {
                          const data = userDoc.data();
                          const primaryRole = normalizeRole(data?.role, UserRole.TAMU);
                          const roles = Array.isArray(data?.roles)
                            ? data.roles.map((r: unknown) => normalizeRole(r, UserRole.TAMU)).filter((r: UserRole) => r !== UserRole.TAMU)
                            : [];
                          const normalizedRoles = roles.length ? roles : [primaryRole].filter((r) => r !== UserRole.TAMU);
                          const schoolId = data?.schoolId || data?.school_id;
                          const accountStatus = (data?.status || 'active').toString();

                          if (!data?.role || primaryRole === UserRole.TAMU || normalizedRoles.length === 0) {
                            toast.error('Akun belum diaktifkan (role belum disetel).');
                            await auth.signOut();
                            return;
                          }

                          if (!schoolId && primaryRole !== UserRole.DEVELOPER) {
                            toast.error('Akun belum memiliki school_id.');
                            await auth.signOut();
                            return;
                          }

                          const nextUser: AppCurrentUser = {
                            uid: user.uid,
                            roles: normalizedRoles,
                            school_id: schoolId || null,
                            status: accountStatus,
                          };

                          setCurrentUser(nextUser);
                          setUserRole(primaryRole);
                          const activeView = getViewFromPath(window.location.pathname);
                          const allowedView = enforceViewAccess(activeView, nextUser, activeView !== ViewState.LOGIN && activeView !== ViewState.REGISTER);
                          if (activeView === ViewState.LOGIN || activeView === ViewState.REGISTER) {
                            setCurrentView(ViewState.DASHBOARD);
                            window.history.replaceState({}, '', getPathFromView(ViewState.DASHBOARD));
                          } else {
                            setCurrentView(allowedView);
                            if (allowedView !== activeView) {
                              window.history.replaceState({}, '', getPathFromView(allowedView));
                            }
                          }
                      } else {
                          toast.error('Data akun sekolah tidak ditemukan.');
                          await auth.signOut();
                          return;
                          setCurrentUser(null);
                          setUserRole(UserRole.TAMU);
                      }
                  } catch (e: any) { 
                      console.warn("Auth sync failure:", e.message);
                  }
              } else {
                  setCurrentUser(null);
                  setUserRole(UserRole.TAMU);
                  const activeView = getViewFromPath(window.location.pathname);
                  if (activeView !== ViewState.LOGIN && activeView !== ViewState.REGISTER) {
                    setCurrentView(ViewState.LOGIN);
                    window.history.replaceState({}, '', getPathFromView(ViewState.LOGIN));
                  }
              }
              setAuthLoading(false);
          });
          return () => unsubscribeAuth();
      } else {
          setAuthLoading(false);
      }

      return () => {
          window.removeEventListener('online', handleOnline);
          window.removeEventListener('offline', handleOffline);
      };
  }, []);

  useEffect(() => {
    const syncFromLocation = () => {
      const requestedView = getViewFromPath(window.location.pathname);
      const allowedView = enforceViewAccess(requestedView, currentUser);
      setCurrentView(allowedView);
      if (allowedView !== requestedView) {
        window.history.replaceState({}, '', getPathFromView(allowedView));
      }
    };

    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, [currentUser]);

  const handleNavigate = (view: ViewState) => {
    const allowedView = enforceViewAccess(view, currentUser);
    const nextPath = getPathFromView(allowedView);
    setViewKey(prev => prev + 1);
    setCurrentView(allowedView);

    if (normalizePath(window.location.pathname) !== nextPath) {
      window.history.pushState({}, '', nextPath);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme(prev => {
        const next = !prev;
        localStorage.setItem('theme', next ? 'dark' : 'light');
        if (next) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        return next;
    });
  };

  const handleLoginSuccess = (role: UserRole) => {
    setUserRole(role);
    setCurrentUser((prev) => prev ? prev : {
      uid: auth?.currentUser?.uid || 'session',
      roles: [role],
      school_id: 'pending',
      status: 'active',
    });
    handleNavigate(ViewState.DASHBOARD);
  };

  const handleLogout = async () => {
    if (!isMockMode && auth) await auth.signOut();
    setCurrentUser(null);
    setUserRole(UserRole.TAMU);
    handleNavigate(ViewState.LOGIN);
  };

  const backToDashboard = () => handleNavigate(ViewState.DASHBOARD);

  if (authLoading) {
      return (
          <div className="fixed inset-0 h-screen w-full flex flex-col items-center justify-center bg-[#020617] z-[100]">
              <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-500">
                  <div className="w-16 h-16 mb-6 opacity-40"><AppLogo className="w-full h-full" /></div>
                  <Loader2 className="w-6 h-6 text-indigo-500 animate-spin opacity-30" />
              </div>
          </div>
      );
  }

  const isAuthView = currentView === ViewState.LOGIN || currentView === ViewState.REGISTER;

  const renderView = (view: ViewState) => {
    switch (view) {
      case ViewState.LOGIN: return <Login onLogin={handleLoginSuccess} onNavigateRegister={() => handleNavigate(ViewState.REGISTER)} />;
      case ViewState.REGISTER: return <Register onLogin={handleLoginSuccess} onLoginClick={() => handleNavigate(ViewState.LOGIN)} />;
      case ViewState.DASHBOARD: return <Dashboard onNavigate={handleNavigate} isDarkMode={isDarkTheme} onToggleTheme={toggleTheme} userRole={userRole} onLogout={handleLogout} canAccessView={(view) => canAccessView(view, currentUser)} />;
      case ViewState.PROFILE: return <Profile onBack={backToDashboard} onLogout={handleLogout} />;
      case ViewState.SCHEDULE: return <Schedule onBack={backToDashboard} />;
      case ViewState.ALL_FEATURES: return <AllFeatures onBack={backToDashboard} onNavigate={handleNavigate} userRole={userRole} />;
      case ViewState.NEWS: return <News onBack={backToDashboard} />;
      case ViewState.ABOUT: return <About onBack={backToDashboard} />;
      case ViewState.LOGIN_HISTORY: return <LoginHistory onBack={backToDashboard} />;
      case ViewState.ID_CARD: return <IDCard onBack={backToDashboard} />;
      case ViewState.HISTORY: return <History onBack={backToDashboard} userRole={userRole} />;
      case ViewState.PREMIUM: return <Premium onBack={backToDashboard} />;
      case ViewState.ADVISOR: return <Advisor onBack={backToDashboard} />;
      case ViewState.MADRASAH_INFO: return <MadrasahInfo onBack={backToDashboard} />;
      case ViewState.KEMENAG_HUB: return <KemenagHub onBack={backToDashboard} />;
      case ViewState.SETTINGS: return <Settings onBack={backToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} isDarkMode={isDarkTheme} onToggleTheme={toggleTheme} userRole={userRole} />;
      case ViewState.PROMOTION: return <ClassPromotion onBack={backToDashboard} />;
      case ViewState.ACADEMIC_YEAR: return <AcademicYear onBack={backToDashboard} />;
      
      // PROTECTED ROUTES
      case ViewState.CLASSES: return <ClassList onBack={backToDashboard} userRole={userRole} />;
      case ViewState.SCANNER: return <QRScanner onBack={backToDashboard} />;
      case ViewState.ATTENDANCE_HISTORY: return <AttendanceHistory onBack={backToDashboard} onNavigate={handleNavigate} userRole={userRole} />;
      case ViewState.PRESENSI: return <Presensi onBack={backToDashboard} onNavigate={handleNavigate} />;
      case ViewState.CONTENT_GENERATION: return <ContentGeneration onBack={backToDashboard} />;
      case ViewState.REPORTS: return <Reports onBack={backToDashboard} />;
      case ViewState.JOURNAL: return <TeachingJournal onBack={backToDashboard} userRole={userRole} />;
      case ViewState.ASSIGNMENTS: return <Assignments onBack={backToDashboard} userRole={userRole} />;
      case ViewState.GRADES:
      case ViewState.REPORT_CARDS: return <Grades onBack={backToDashboard} userRole={userRole} />;
      case ViewState.STUDENTS: return <StudentData onBack={backToDashboard} userRole={userRole} />;
      case ViewState.TEACHERS: return <TeacherData onBack={backToDashboard} userRole={userRole} />;
      case ViewState.LETTERS: return <Letters onBack={backToDashboard} userRole={userRole} />;
      case ViewState.POINTS: return <PointsView onBack={backToDashboard} />;
      case ViewState.CLAIM_MANAGEMENT: return <ClaimManagement onBack={backToDashboard} />;
      case ViewState.CREATE_ACCOUNT: return <CreateAccount onBack={backToDashboard} userRole={userRole} />;
      case ViewState.DEVELOPER: return <DeveloperConsole onBack={backToDashboard} />;
      
      default: return <Dashboard onNavigate={handleNavigate} isDarkMode={isDarkTheme} onToggleTheme={toggleTheme} userRole={userRole} onLogout={handleLogout} canAccessView={(view) => canAccessView(view, currentUser)} />;
    }
  };

  return (
    <div className="h-screen w-full flex flex-col font-sans overflow-hidden bg-white dark:bg-[#020617] relative">
        {!isOnline && (
            <div className="fixed top-0 left-0 right-0 z-[1000] bg-orange-600 text-white text-[9px] font-black uppercase tracking-[0.2em] text-center py-1">
                Mode Offline Aktif
            </div>
        )}
        <div className="h-full w-full relative flex overflow-hidden">
            {!isAuthView && (
                <div className="hidden md:block w-72 lg:w-80 shrink-0 h-full border-r border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-[#0B1121]/50 backdrop-blur-xl z-40">
                    <Sidebar currentView={currentView} onNavigate={handleNavigate} userRole={userRole} onLogout={handleLogout} canAccessView={(view) => canAccessView(view, currentUser)} />
                </div>
            )}
            
            <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden">
                <div key={viewKey} className={`flex-1 overflow-hidden relative animate-in fade-in slide-in-from-bottom-2 duration-300 ${!isOnline ? 'mt-4' : ''}`}>
                    <Suspense fallback={viewFallback}>
                      {renderView(currentView)}
                    </Suspense>
                </div>
                
                {!isAuthView && (
                    <div className="shrink-0 z-50">
                      <BottomNav currentView={currentView} onNavigate={handleNavigate} userRole={userRole} canAccessView={(view) => canAccessView(view, currentUser)} />
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default App;
