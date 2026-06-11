import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
export interface Application {
  applicationId: string;
  name: string;
  program: string;
  college?: string;
  collegeName?: string;
  submittedOn: string;
  status: string;
  lastUpdated: string;
  queryMessage: string;
  data: any;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  applicationId?: string;
  application?: Application;
  applications?: Application[];
}

@Injectable({
  providedIn: 'root',
})
export class ApplicationService {
  private readonly API_URL = `${environment.apiUrl}/applications`;
  private readonly OTP_URL = `${environment.apiUrl}/otp`;

  constructor(private http: HttpClient) { }

  sendEmailOtp(email: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.OTP_URL}/send-email-otp`, { email });
  }

  verifyEmailOtp(email: string, otp: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.OTP_URL}/verify-email-otp`, { email, otp });
  }

  submitApplication(formData: any): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(this.API_URL, { formData });
  }

  getAllApplications(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(this.API_URL);
  }

  getApplicationById(applicationId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.API_URL}/${encodeURIComponent(applicationId)}`);
  }

  getApplicationByEmail(email: string, excludeAppId?: string): Observable<ApiResponse> {
    const params: any = { email };
    if (excludeAppId) params.excludeAppId = excludeAppId;
    return this.http.get<ApiResponse>(`${this.API_URL}/by-email`, { params });
  }

  getApplicationByAadhar(aadhar: string, excludeAppId?: string): Observable<ApiResponse> {
    const params: any = { aadhar };
    if (excludeAppId) params.excludeAppId = excludeAppId;
    return this.http.get<ApiResponse>(`${this.API_URL}/by-aadhar`, { params });
  }

  uploadDocuments(applicationId: string, formData: FormData): Observable<any> {
    return this.http.post(`${this.API_URL}/upload-docs/${encodeURIComponent(applicationId)}`, formData);
  }

  updateApplicationStatus(applicationId: string, status: string, queryMessage?: string): Observable<ApiResponse> {
    const body: any = { status };
    if (queryMessage !== undefined) {
      body.queryMessage = queryMessage;
    }
    return this.http.patch<ApiResponse>(`${this.API_URL}/${encodeURIComponent(applicationId)}`, body);
  }

  updateApplication(applicationId: string, formData: any): Observable<ApiResponse> {
    return this.http.put<ApiResponse>(`${this.API_URL}/${encodeURIComponent(applicationId)}/edit`, { formData });
  }

  deleteApplication(applicationId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.API_URL}/${encodeURIComponent(applicationId)}`);
  }
}
