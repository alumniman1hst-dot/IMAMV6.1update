
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
import ProtectedRoute from './ProtectedRoute';
const Advisor = React.lazy(() => import('./Advisor'));
const Settings = React.lazy(() => import('./Settings'));
const PointsView = React.lazy(() => import('./PointsView'));
import { ViewState, UserRole } from '../types';
import { normalizeRole } from '../src/auth/roles';
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
  return pathToView[normalized] || ViewState.DASHBOARD;
};

const getPathFromView = (view: ViewState): string => viewToPath[view] || '/dashboard';

const App: React.FC = () => {
  const viewFallback = (
    <div className="h-full w-full flex items-center justify-center bg-white dark:bg-[#020617]">
      <Loader2 className="w-7 h-7 text-indigo-500 animate-spin opacity-70" />
    </div>
  );

  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.TAMU);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewKey, setViewKey] = useState(0); 

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
                          const role = normalizeRole(data?.role, UserRole.TAMU);
                          const schoolId = data?.schoolId || data?.school_id;

                          if (!data?.role || role === UserRole.TAMU) {
                            toast.error('Akun belum diaktifkan (role belum disetel).');
                            await auth.signOut();
                            return;
                          }

                          if (!schoolId && role !== UserRole.DEVELOPER) {
                            toast.error('Akun belum memiliki school_id.');
                            await auth.signOut();
                            return;
                          }

                          setUserRole(role);
                          const activeView = getViewFromPath(window.location.pathname);
                          if (activeView === ViewState.LOGIN || activeView === ViewState.REGISTER) {
                            setCurrentView(ViewState.DASHBOARD);
                            window.history.replaceState({}, '', getPathFromView(ViewState.DASHBOARD));
                          } else {
                            setCurrentView(activeView);
                          }
                      } else {
                          toast.error('Data akun sekolah tidak ditemukan.');
                          await auth.signOut();
                          return;
                          setUserRole(UserRole.TAMU);
                          const activeView = getViewFromPath(window.location.pathname);
                          if (activeView === ViewState.LOGIN || activeView === ViewState.REGISTER) {
                            setCurrentView(ViewState.DASHBOARD);
                            window.history.replaceState({}, '', getPathFromView(ViewState.DASHBOARD));
                          } else {
                            setCurrentView(activeView);
                          }
                      }
                  } catch (e: any) { 
                      console.warn("Auth sync failure:", e.message);
                  }
              } else {
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
      const nextView = getViewFromPath(window.location.pathname);
      setCurrentView(nextView);
    };

    syncFromLocation();
    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, []);

  const handleNavigate = (view: ViewState) => {
    const nextPath = getPathFromView(view);
    setViewKey(prev => prev + 1);
    setCurrentView(view);

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
    handleNavigate(ViewState.DASHBOARD);
  };

  const handleLogout = async () => {
    if (!isMockMode && auth) await auth.signOut();
    setUserRole(UserRole.TAMU);
    handleNavigate(ViewState.LOGIN);
  };

  const backToDashboard = () => handleNavigate(ViewState.DASHBOARD);

  // Role Group Definitions
  const staffAbove = [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.STAF_TU, UserRole.WALI_KELAS, UserRole.KEPALA_MADRASAH];
  const adminDevOnly = [UserRole.ADMIN, UserRole.DEVELOPER];
  const devOnly = [UserRole.DEVELOPER];

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
      case ViewState.DASHBOARD: return <Dashboard onNavigate={handleNavigate} isDarkMode={isDarkTheme} onToggleTheme={toggleTheme} userRole={userRole} onLogout={handleLogout} />;
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
      case ViewState.CLASSES: return <ProtectedRoute allowedRoles={staffAbove} userRole={userRole} onBack={backToDashboard}><ClassList onBack={backToDashboard} userRole={userRole} /></ProtectedRoute>;
      case ViewState.SCANNER: return <ProtectedRoute allowedRoles={staffAbove} userRole={userRole} onBack={backToDashboard}><QRScanner onBack={backToDashboard} /></ProtectedRoute>;
      case ViewState.ATTENDANCE_HISTORY: return <AttendanceHistory onBack={backToDashboard} onNavigate={handleNavigate} userRole={userRole} />;
      case ViewState.PRESENSI: return <ProtectedRoute allowedRoles={staffAbove} userRole={userRole} onBack={backToDashboard}><Presensi onBack={backToDashboard} onNavigate={handleNavigate} /></ProtectedRoute>;
      case ViewState.CONTENT_GENERATION: return <ProtectedRoute allowedRoles={staffAbove} userRole={userRole} onBack={backToDashboard}><ContentGeneration onBack={backToDashboard} /></ProtectedRoute>;
      case ViewState.REPORTS: return <ProtectedRoute allowedRoles={adminDevOnly} userRole={userRole} onBack={backToDashboard}><Reports onBack={backToDashboard} /></ProtectedRoute>;
      case ViewState.JOURNAL: return <ProtectedRoute allowedRoles={staffAbove} userRole={userRole} onBack={backToDashboard}><TeachingJournal onBack={backToDashboard} userRole={userRole} /></ProtectedRoute>;
      case ViewState.ASSIGNMENTS: return <Assignments onBack={backToDashboard} userRole={userRole} />;
      case ViewState.GRADES:
      case ViewState.REPORT_CARDS: return <Grades onBack={backToDashboard} userRole={userRole} />;
      case ViewState.STUDENTS: return <ProtectedRoute allowedRoles={staffAbove} userRole={userRole} onBack={backToDashboard}><StudentData onBack={backToDashboard} userRole={userRole} /></ProtectedRoute>;
      case ViewState.TEACHERS: return <ProtectedRoute allowedRoles={staffAbove} userRole={userRole} onBack={backToDashboard}><TeacherData onBack={backToDashboard} userRole={userRole} /></ProtectedRoute>;
      case ViewState.LETTERS: return <Letters onBack={backToDashboard} userRole={userRole} />;
      case ViewState.POINTS: return <PointsView onBack={backToDashboard} />;
      case ViewState.CLAIM_MANAGEMENT: return <ProtectedRoute allowedRoles={adminDevOnly} userRole={userRole} onBack={backToDashboard}><ClaimManagement onBack={backToDashboard} /></ProtectedRoute>;
      case ViewState.CREATE_ACCOUNT: return <ProtectedRoute allowedRoles={adminDevOnly} userRole={userRole} onBack={backToDashboard}><CreateAccount onBack={backToDashboard} userRole={userRole} /></ProtectedRoute>;
      case ViewState.DEVELOPER: return <ProtectedRoute allowedRoles={devOnly} userRole={userRole} onBack={backToDashboard}><DeveloperConsole onBack={backToDashboard} /></ProtectedRoute>;
      
      default: return <Dashboard onNavigate={handleNavigate} isDarkMode={isDarkTheme} onToggleTheme={toggleTheme} userRole={userRole} onLogout={handleLogout} />;
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
                    <Sidebar currentView={currentView} onNavigate={handleNavigate} userRole={userRole} onLogout={handleLogout} />
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
                      <BottomNav currentView={currentView} onNavigate={handleNavigate} userRole={userRole} />
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default App;
