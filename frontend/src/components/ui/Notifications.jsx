import React from 'react';

const Notifications = ({ notifications = [] }) => {
  return (
    <div className="space-y-4">
      {notifications.map((notification, index) => (
        <div key={index} className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start space-x-4">
            <div className="bg-gray-200 rounded-lg p-3 flex-shrink-0">
              <img
                src={notification.icon}
                alt="notification icon"
                className="w-6 h-6"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-medium text-gray-900 leading-5">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1 leading-4">
                {notification.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Notifications;