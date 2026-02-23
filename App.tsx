
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 * Core Application Engine
 */

import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { ViewState, UserRole } from './types';
import { normalizeRole } from './src/auth/roles';
import { auth, db, isMockMode } from './services/firebase';
import { Loader2, AppLogo } from './components/Icons';

// View Components
import Login from './components/Login';
// Added Register import to support routing logic
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Presensi from './components/Presensi';
import ContentGeneration from './components/ContentGeneration';
import ClassList from './components/ClassList';
import Schedule from './components/Schedule';
import Profile from './components/Profile';
import AcademicYear from './components/AcademicYear';
import Reports from './components/Reports';
import ProtectedRoute from './components/ProtectedRoute';
import Advisor from './components/Advisor';
import Settings from './components/Settings';
import PointsView from './components/PointsView';
import AllFeatures from './components/AllFeatures';
import AttendanceHistory from './components/AttendanceHistory';
import QRScanner from './components/QRScanner';
import TeachingJournal from './components/TeachingJournal';
import Assignments from './components/Assignments';
import Grades from './components/Grades';
import StudentData from './components/StudentData';
import TeacherData from './components/TeacherData';
import IDCard from './components/IDCard';
import Letters from './components/Letters';
import CreateAccount from './components/CreateAccount';
import DeveloperConsole from './components/DeveloperConsole';
import LoginHistory from './components/LoginHistory';
import About from './components/About';
import History from './components/History';
import Premium from './components/Premium';
import News from './components/News';
import MadrasahInfo from './components/MadrasahInfo';
import KemenagHub from './components/KemenagHub';
import Onboarding from './components/Onboarding';

// Layout & Shell
import MobileContainer from './components/MobileContainer';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.GURU);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [viewMode, setViewMode] = useState<'phone' | 'full'>('phone');
  const [viewKey, setViewKey] = useState(0);

  useEffect(() => {
    // 1. Initial Theme Logic
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDarkTheme(shouldBeDark);
    if (shouldBeDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');

    // 2. Onboarding Check
    const onboardDone = localStorage.getItem('imam_onboarding_done');
    if (!onboardDone) {
      setShowOnboarding(true);
    }

    // 3. Auth Listener
    if (isMockMode) {
      setAuthLoading(false);
    } else if (auth) {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user && db) {
          try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
              const data = userDoc.data();
              setUserRole(normalizeRole(data?.role, UserRole.GURU));
              setCurrentView(v => v === ViewState.LOGIN ? ViewState.DASHBOARD : v);
            }
          } catch (e) {
            console.error("Auth sync error:", e);
          }
        }
        setAuthLoading(false);
      });
      return () => unsubscribe();
    } else {
      setAuthLoading(false);
    }
  }, []);

  const handleNavigate = (view: ViewState) => {
    setViewKey(prev => prev + 1);
    setCurrentView(view);
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
    setUserRole(UserRole.SISWA);
    handleNavigate(ViewState.LOGIN);
    toast.info("Anda telah keluar dari sistem.");
  };

  const backToDashboard = () => handleNavigate(ViewState.DASHBOARD);

  if (authLoading) {
    return (
      <div className="fixed inset-0 h-screen w-full flex flex-col items-center justify-center bg-[#020617] z-[100]">
        <div className="relative flex flex-col items-center animate-in fade-in duration-700">
          <div className="w-20 h-20 mb-8 opacity-60">
            <AppLogo className="w-full h-full" />
          </div>
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin opacity-40" />
          <p className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">Initializing System</p>
        </div>
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onStart={() => setShowOnboarding(false)} />;
  }

  // Role Group Definitions
  const staffAbove = [UserRole.ADMIN, UserRole.DEVELOPER, UserRole.GURU, UserRole.STAF_TU, UserRole.WALI_KELAS, UserRole.KEPALA_MADRASAH];
  const adminDevOnly = [UserRole.ADMIN, UserRole.DEVELOPER];
  const devOnly = [UserRole.DEVELOPER];

  const renderCurrentView = () => {
    switch (currentView) {
      // Fix: Provided onNavigateRegister prop to Login component to resolve TS error
      case ViewState.LOGIN: return <Login onLogin={handleLoginSuccess} onNavigateRegister={() => handleNavigate(ViewState.REGISTER)} />;
      // Added Register view to handle registration flow
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
      case ViewState.CREATE_ACCOUNT: 
        return (
            <ProtectedRoute allowedRoles={adminDevOnly} userRole={userRole} onBack={backToDashboard}>
                <CreateAccount onBack={backToDashboard} userRole={userRole} />
            </ProtectedRoute>
        );
      case ViewState.DEVELOPER: return <ProtectedRoute allowedRoles={devOnly} userRole={userRole} onBack={backToDashboard}><DeveloperConsole onBack={backToDashboard} /></ProtectedRoute>;
      case ViewState.SETTINGS: return <Settings onBack={backToDashboard} onNavigate={handleNavigate} onLogout={handleLogout} isDarkMode={isDarkTheme} onToggleTheme={toggleTheme} userRole={userRole} />;
      default: return <Dashboard onNavigate={handleNavigate} isDarkMode={isDarkTheme} onToggleTheme={toggleTheme} userRole={userRole} onLogout={handleLogout} />;
    }
  };

  const isAuthView = currentView === ViewState.LOGIN || currentView === ViewState.REGISTER;

  return (
    <MobileContainer 
      isDarkTheme={isDarkTheme} 
      viewMode={viewMode} 
      onViewModeChange={setViewMode}
    >
      <div className="h-full w-full flex relative overflow-hidden bg-white dark:bg-[#020617]">
        <Toaster position="top-center" expand={false} richColors />
        
        {/* Desktop Sidebar */}
        {!isAuthView && (
          <div className="hidden md:block w-72 lg:w-80 shrink-0 h-full border-r border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-[#0B1121]/50 backdrop-blur-xl z-40">
            <Sidebar currentView={currentView} onNavigate={handleNavigate} userRole={userRole} onLogout={handleLogout} />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden">
          <div 
            key={viewKey} 
            className="flex-1 overflow-hidden relative animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {renderCurrentView()}
          </div>
          
          {/* Navigation (Mobile Docks) */}
          {!isAuthView && (
            <div className="shrink-0 z-50 md:hidden">
              <BottomNav currentView={currentView} onNavigate={handleNavigate} userRole={userRole} />
            </div>
          )}
        </div>
      </div>
    </MobileContainer>
  );
};

export default App;
