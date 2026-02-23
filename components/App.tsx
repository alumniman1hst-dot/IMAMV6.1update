
/**
 * @license
 * IMAM System - Integrated Madrasah Academic Manager
 */

import React, { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import Presensi from './Presensi';
import ContentGeneration from './ContentGeneration';
import ClassList from './ClassList';
import ClassPromotion from './ClassPromotion';
import Schedule from './Schedule';
import BottomNav from './BottomNav';
import GenericView from './GenericView';
import Sidebar from './Sidebar';
import Profile from './Profile';
import AcademicYear from './AcademicYear';
import Reports from './Reports';
import ProtectedRoute from './ProtectedRoute';
import Advisor from './Advisor';
import Settings from './Settings';
import PointsView from './PointsView';
import { ViewState, UserRole } from '../types';
import { normalizeRole } from '../src/auth/roles';
import { toast } from 'sonner';
import { Loader2, AppLogo } from './Icons';
import { auth, db, isMockMode } from '../services/firebase';

// Feature Views
import AllFeatures from './AllFeatures';
import AttendanceHistory from './AttendanceHistory';
import QRScanner from './QRScanner';
import TeachingJournal from './TeachingJournal';
import Assignments from './Assignments';
import Grades from './Grades';
import StudentData from './StudentData';
import TeacherData from './TeacherData';
import IDCard from './IDCard';
import Letters from './Letters';
import CreateAccount from './CreateAccount';
import DeveloperConsole from './DeveloperConsole';
import LoginHistory from './LoginHistory';
import About from './About';
import History from './History';
import Premium from './Premium';
import News from './News';
import MadrasahInfo from './MadrasahInfo';
import KemenagHub from './KemenagHub';
import ClaimManagement from './ClaimManagement';

const App: React.FC = () => {
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
                          setUserRole(role);
                          setCurrentView(prev => (prev === ViewState.LOGIN || prev === ViewState.REGISTER) ? ViewState.DASHBOARD : prev);
                      } else {
                          setUserRole(UserRole.TAMU);
                          setCurrentView(prev => (prev === ViewState.LOGIN || prev === ViewState.REGISTER) ? ViewState.DASHBOARD : prev);
                      }
                  } catch (e: any) { 
                      console.warn("Auth sync failure:", e.message);
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

  const renderView = () => {
    switch (currentView) {
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
                    {renderView()}
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
