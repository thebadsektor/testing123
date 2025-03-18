import React from 'react';
import Image from 'next/image';
import Logo from '../../../public/ai-logo.svg';

const Navbar: React.FC = () => {
    return (
      <nav className="fixed top-0 left-0 w-full bg-blue-800 text-white p-4 shadow z-50"> {/* Added z-50 */}
        <div className="container mx-auto flex items-center">
          <Image 
            src={Logo} 
            alt="Logo" 
            width={40} 
            height={40} 
            className="mr-2 filter brightness-200"
          />
          <h1 className="text-lg font-bold">Scopic AutoPR</h1>
        </div>
      </nav>
    );
  };

export default Navbar;
