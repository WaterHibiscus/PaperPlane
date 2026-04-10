import { request } from '../request';

// Stats
export function fetchStats() {
  return request<Api.PaperPlane.Stats>({ url: '/api/stats' });
}

export function fetchHomeHeadlinesConfig() {
  return request<Api.PaperPlane.HomeHeadlineConfig>({ url: '/api/admin/home/headlines' });
}

export function updateHomeHeadlines(data: { phrases: string[] }) {
  return request<Api.PaperPlane.HomeHeadlineConfig>({ url: '/api/admin/home/headlines', method: 'put', data });
}

// Locations
export function fetchLocations() {
  return request<Api.PaperPlane.Location[]>({ url: '/api/locations' });
}

export function searchLocations(params?: { keyword?: string }) {
  return request<Api.PaperPlane.Location[]>({ url: '/api/locations', params });
}

export function createLocation(data: { name: string; sortOrder: number; iconUrl?: string | null }) {
  return request<Api.PaperPlane.Location>({ url: '/api/locations', method: 'post', data });
}

export function updateLocation(id: number, data: { name: string; sortOrder: number; iconUrl?: string | null }) {
  return request<void>({ url: `/api/locations/${id}`, method: 'put', data });
}

export function deleteLocation(id: number) {
  return request<void>({ url: `/api/locations/${id}`, method: 'delete' });
}

export function uploadLocationIcon(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  return request<{ url: string }>({
    url: '/api/uploads/location-icons',
    method: 'post',
    data: formData
  });
}

// Planes
export function fetchAdminPlanes(params?: {
  id?: string;
  keyword?: string;
  location?: string;
  mood?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
}) {
  return request<Api.PaperPlane.Plane[]>({ url: '/api/planes/admin', params });
}

export function deletePlane(id: string) {
  return request<void>({ url: `/api/planes/${id}`, method: 'delete' });
}

// Reports
export function fetchReportedPlanes() {
  return request<Api.PaperPlane.Plane[]>({ url: '/api/planes/reported' });
}

// Comments
export function fetchAdminComments(params?: {
  keyword?: string;
  planeId?: string;
  page?: number;
  pageSize?: number;
}) {
  return request<Api.PaperPlane.PagedResponse<Api.PaperPlane.AdminComment>>({
    url: '/api/admin/comments',
    params
  });
}

export function deleteComment(id: string) {
  return request<void>({ url: `/api/admin/comments/${id}`, method: 'delete' });
}

export function fetchPlaneComments(planeId: string) {
  return request<Api.PaperPlane.Comment[]>({ url: `/api/planes/${planeId}/comments` });
}

// App users
export function fetchAdminUsers(params?: {
  keyword?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}) {
  return request<Api.PaperPlane.PagedResponse<Api.PaperPlane.AdminUser>>({
    url: '/api/admin/users',
    params
  });
}

export function updateAppUserStatus(id: string, data: { isActive: boolean }) {
  return request<void>({ url: `/api/admin/users/${id}/status`, method: 'put', data });
}
