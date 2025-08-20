'use client';

import { useState } from 'react';
import { BeltSystemAPI } from '../lib/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface APIStatus {
  endpoint: string;
  status: 'loading' | 'success' | 'error';
  message: string;
  data?: unknown;
}

export function APITest() {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const testEndpoints = [
    { name: 'Belts Count', method: () => BeltSystemAPI.getBeltsCount({ limit: 1 }) },
    { name: 'Belts Frequency', method: () => BeltSystemAPI.getBeltsFrequency() },
    { name: 'Profiles Count', method: () => BeltSystemAPI.getProfilesCount() },
    { name: 'Promotions Count', method: () => BeltSystemAPI.getPromotionsCount() },
  ];

  const testAPI = async () => {
    setIsTesting(true);
    const newStatuses: APIStatus[] = [];

    for (const endpoint of testEndpoints) {
      newStatuses.push({
        endpoint: endpoint.name,
        status: 'loading',
        message: 'Testing...',
      });
      setApiStatuses([...newStatuses]);

      try {
        const data = await endpoint.method();
        newStatuses[newStatuses.length - 1] = {
          endpoint: endpoint.name,
          status: 'success',
          message: 'Success',
          data,
        };
      } catch (error) {
        newStatuses[newStatuses.length - 1] = {
          endpoint: endpoint.name,
          status: 'error',
          message: error.message || 'Request failed',
        };
      }
      setApiStatuses([...newStatuses]);
    }

    setIsTesting(false);
  };

  const getStatusIcon = (status: APIStatus['status']) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: APIStatus['status']) => {
    switch (status) {
      case 'loading':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">API Connection Test</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            <strong>API URL:</strong> Backend API
          </div>
          <button
            onClick={testAPI}
            disabled={isTesting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              'Test API Connection'
            )}
          </button>
        </div>
      </div>

      {apiStatuses.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-900">Test Results:</h4>
          {apiStatuses.map((status, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 border rounded-lg ${getStatusColor(status.status)}`}
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.status)}
                <span className="font-medium text-gray-900">{status.endpoint}</span>
              </div>
              <div className="text-right">
                <div className={`text-sm font-medium ${
                  status.status === 'success' ? 'text-green-800' :
                  status.status === 'error' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {status.message}
                </div>
                {status.data !== undefined && (
                  <div className="text-xs text-gray-600 mt-1">
                    Response: {JSON.stringify(status.data)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Troubleshooting Tips:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Make sure your backend server is running</li>
          <li>• Verify the API URL in <code className="bg-gray-200 px-1 rounded">src/config/api.ts</code></li>
          <li>• Check that your backend accepts CORS requests from this domain</li>
          <li>• Ensure all required environment variables are set</li>
        </ul>
      </div>
    </div>
  );
}
