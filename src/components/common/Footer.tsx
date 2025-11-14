import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* ================= About Us ================= */}
          <div>
            <h3 className="text-lg font-semibold text-amber-800 mb-4">
              About Newomen
            </h3>
            <p className="text-gray-600">
              Your AI-powered companion for self-discovery, personal growth, and transformative conversations. 
              Discover yourself through assessments, shadow work, and meaningful connections.
            </p>
          </div>

          {/* ================= Contact Information ================= */}
          <div>
            <h3 className="text-lg font-semibold text-amber-800 mb-4">
              Connect With Us
            </h3>
            <div className="text-gray-600 space-y-2">
              <p>
                Join our community to share your journey
              </p>
              <p>
                Support available through the app
              </p>
            </div>
          </div>

          {/* ================= Resources ================= */}
          <div>
            <h3 className="text-lg font-semibold text-amber-800 mb-4">
              Resources
            </h3>
            <div className="text-gray-600 space-y-2">
              <p>
                Wellness Library
              </p>
              <p>
                Community Events
              </p>
              <p>
                Shadow Work Journeys
              </p>
            </div>
          </div>
        </div>

        {/* ================= Copyright Section ================= */}
        <div className="mt-8 pt-8 border-t border-amber-200 text-center text-gray-600">
          <p>
            © {currentYear} Newomen. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
