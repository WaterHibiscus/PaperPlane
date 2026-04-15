import { AxiosHeaders } from 'axios';
import type { AxiosResponse } from 'axios';
import { createFlatRequest, createRequest } from '@sa/axios';
import { getServiceBaseURL } from '@/utils/service';
import { getAuthorization, showErrorMsg } from './shared';
import type { RequestInstanceState } from './type';

const isHttpProxy = import.meta.env.DEV && import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL, otherBaseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);

export const request = createFlatRequest(
  {
    baseURL: baseURL || 'http://localhost:5000'
  },
  {
    defaultState: {
      errMsgStack: [],
      refreshTokenPromise: null
    } as RequestInstanceState,
    transform(response: AxiosResponse) {
      // Our API returns data directly, no wrapper
      return response.data;
    },
    async onRequest(config) {
      const headers = AxiosHeaders.from(config.headers);
      const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;

      // Let browser set multipart boundary automatically for FormData uploads.
      if (isFormData) {
        headers.delete('Content-Type');
      }

      const authorization = getAuthorization();
      if (authorization) {
        headers.set('Authorization', authorization);
      }

      config.headers = headers;
      return config;
    },
    isBackendSuccess(response) {
      // Our API uses HTTP status codes, 2xx means success
      return response.status >= 200 && response.status < 300;
    },
    async onBackendFail(_response, _instance) {
      return null;
    },
    onError(error) {
      let message = error.message;
      showErrorMsg(request.state, message);
    }
  }
);

export const demoRequest = createRequest(
  {
    baseURL: otherBaseURL.demo
  },
  {
    transform(response: AxiosResponse) {
      return response.data;
    },
    async onRequest(config) {
      return config;
    },
    isBackendSuccess(response) {
      return response.status >= 200 && response.status < 300;
    },
    async onBackendFail(_response) {},
    onError(error) {
      window.$message?.error(error.message);
    }
  }
);
