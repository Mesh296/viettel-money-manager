import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { IconContext } from "react-icons";

const MainLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return (
    <IconContext.Provider value={{ className: "react-icons", size: "1.1em" }}>
      <div className="grid grid-cols-12 min-h-screen bg-orange-50 text-gray-800">
        {/* Sidebar */}
        {isAuthenticated && <Sidebar />}
        
        {/* Main content */}
        <main className={`${isAuthenticated ? 'col-span-9' : 'col-span-12'} p-8`}>
          {children}
        </main>
      </div>
    </IconContext.Provider>
  );
};

export default MainLayout; 