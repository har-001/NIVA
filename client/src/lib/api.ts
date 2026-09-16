// ============================================
// NIVA — API Client
// ============================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('niva_token', token);
    } else {
      localStorage.removeItem('niva_token');
    }
  }

  getToken(): string | null {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('niva_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Request failed');
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Cannot connect to server. Please check if the server is running.');
      }
      throw error;
    }
  }

  // Auth
  async register(email: string, username: string, password: string, displayName?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password, displayName }),
    });
  }

  async login(emailOrUsername: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ emailOrUsername, password }),
    });
  }

  async logout() {
    const result = await this.request('/auth/logout', { method: 'POST' });
    this.setToken(null);
    return result;
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  // Biometric & Written PIN Security
  async getSecurityStatus() {
    return this.request<{ faceVerified: boolean; hasPin: boolean; defaultPin: string }>('/auth/security/status');
  }

  async markFaceVerified() {
    return this.request('/auth/face/verified', { method: 'POST' });
  }

  async verifyHumanFace(image: string) {
    return this.request<{ hasHumanFace: boolean; confidence: number; message: string }>('/auth/face/verify-human', {
      method: 'POST',
      body: JSON.stringify({ image }),
    });
  }

  async verifyPin(pin: string) {
    return this.request('/auth/pin/verify', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }

  async setPin(pin: string) {
    return this.request('/auth/pin/set', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  }

  // Chat
  async createConversation(title?: string) {
    return this.request('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async getConversations() {
    return this.request('/chat/conversations');
  }

  async getConversation(id: string) {
    return this.request(`/chat/conversations/${id}`);
  }

  async deleteConversation(id: string) {
    return this.request(`/chat/conversations/${id}`, { method: 'DELETE' });
  }

  // Memory
  async getMemories(category?: string) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<Array<{
      id: string;
      key: string;
      content: string;
      category: string;
      isPinned: boolean;
      confidence: number;
      createdAt: string;
      updatedAt: string;
    }>>(`/memory${query}`);
  }

  async saveMemory(key: string, content: string, category?: string) {
    return this.request('/memory', {
      method: 'POST',
      body: JSON.stringify({ key, content, category }),
    });
  }

  async searchMemories(query: string, topK = 5) {
    return this.request('/memory/search', {
      method: 'POST',
      body: JSON.stringify({ query, topK }),
    });
  }

  async togglePinMemory(key: string) {
    return this.request(`/memory/${encodeURIComponent(key)}/pin`, {
      method: 'PATCH',
    });
  }

  async deleteMemory(key: string) {
    return this.request(`/memory/${encodeURIComponent(key)}`, {
      method: 'DELETE',
    });
  }

  // Documents (RAG)
  async getDocuments() {
    return this.request<Array<{
      id: string;
      filename: string;
      mimeType: string;
      fileSize: number;
      chunkCount: number;
      createdAt: string;
    }>>('/documents');
  }

  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async searchDocuments(query: string, topK = 5) {
    return this.request('/documents/search', {
      method: 'POST',
      body: JSON.stringify({ query, topK }),
    });
  }

  async deleteDocument(id: string) {
    return this.request(`/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  // Generation
  async generateImage(options: {
    prompt: string;
    style?: string;
    aspectRatio?: string;
    seed?: number;
  }) {
    return this.request<{
      imageUrl: string;
      localPath: string;
      prompt: string;
      style: string;
      aspectRatio: string;
      width: number;
      height: number;
    }>('/generate/image', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async generateCode(options: {
    prompt: string;
    language?: string;
    includeTests?: boolean;
  }) {
    return this.request<{
      code: string;
      language: string;
      explanation: string;
      fileName: string;
      suggestedRunCommand: string;
    }>('/generate/code', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async generateDocument(options: {
    topic: string;
    format?: string;
    sections?: string[];
  }) {
    return this.request<{
      content: string;
      format: string;
      fileName: string;
      fileUrl?: string;
      wordCount: number;
    }>('/generate/document', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async generateAudio(options: {
    text: string;
    voice?: string;
    format?: string;
  }) {
    return this.request<{
      audioUrl: string;
      localPath: string;
      durationSeconds?: number;
    }>('/generate/audio', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async getGenerationJobs(type?: string) {
    const q = type ? `?type=${encodeURIComponent(type)}` : '';
    return this.request<Array<{
      id: string;
      type: string;
      status: string;
      input: any;
      output?: any;
      error?: string;
      createdAt: string;
      completedAt?: string;
    }>>(`/generate/jobs${q}`);
  }

  // Communication Hub
  async getContacts(query?: string): Promise<any> {
    const q = query ? `?q=${encodeURIComponent(query)}` : '';
    return (await this.request<any>(`/communication/contacts${q}`)) as any;
  }

  async saveContact(contact: any): Promise<any> {
    return (await this.request<any>('/communication/contacts', {
      method: 'POST',
      body: JSON.stringify(contact),
    })) as any;
  }

  async deleteContact(id: string): Promise<any> {
    return (await this.request<any>(`/communication/contacts/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })) as any;
  }

  async sendCommunication(data: {
    channel: 'email' | 'whatsapp' | 'telegram' | 'sms';
    recipient: string;
    subject?: string;
    content: string;
  }): Promise<any> {
    return (await this.request<any>('/communication/send', {
      method: 'POST',
      body: JSON.stringify(data),
    })) as any;
  }

  async getCommunicationHistory(): Promise<any> {
    return (await this.request<any>('/communication/history')) as any;
  }

  async startCall(data: { contactName: string; phoneNumber: string; direction?: string }): Promise<any> {
    return (await this.request<any>('/communication/call/start', {
      method: 'POST',
      body: JSON.stringify(data),
    })) as any;
  }

  async addCallTranscript(callId: string, speaker: 'user' | 'assistant' | 'contact', text: string): Promise<any> {
    return (await this.request<any>(`/communication/call/${encodeURIComponent(callId)}/transcript`, {
      method: 'POST',
      body: JSON.stringify({ speaker, text }),
    })) as any;
  }

  async toggleCallRecord(callId: string): Promise<any> {
    return (await this.request<any>(`/communication/call/${encodeURIComponent(callId)}/toggle-record`, {
      method: 'POST',
    })) as any;
  }

  async endCall(callId: string, duration?: number): Promise<any> {
    return (await this.request<any>(`/communication/call/${encodeURIComponent(callId)}/end`, {
      method: 'POST',
      body: JSON.stringify({ duration }),
    })) as any;
  }

  async getCallHistory(): Promise<any> {
    return (await this.request<any>('/communication/call/history')) as any;
  }

  // Launch code or text in VS Code or Notepad on laptop
  async openInIde(data: {
    code: string;
    language?: string;
    ide?: 'vscode' | 'notepad';
    fileName?: string;
  }): Promise<{ success: boolean; filePath: string; message: string }> {
    return (await this.request<{ success: boolean; filePath: string; message: string }>('/chat/open-ide', {
      method: 'POST',
      body: JSON.stringify(data),
    })) as any;
  }

  // Launch any Windows application directly from chat cards
  async openApp(app: string, argument?: string): Promise<{ success: boolean; message: string }> {
    return (await this.request<{ success: boolean; message: string }>('/chat/open-app', {
      method: 'POST',
      body: JSON.stringify({ app, argument }),
    })) as any;
  }

  // Internet Intelligence
  async searchInternet(query: string, limit?: number): Promise<any> {
    const q = encodeURIComponent(query);
    const lim = limit ? `&limit=${limit}` : '';
    return (await this.request<any>(`/internet/search?q=${q}${lim}`)) as any;
  }

  async readWebpage(url: string): Promise<any> {
    const u = encodeURIComponent(url);
    return (await this.request<any>(`/internet/read?url=${u}`)) as any;
  }

  async fetchNews(topic?: string, limit?: number): Promise<any> {
    const t = topic ? `?topic=${encodeURIComponent(topic)}` : '';
    const lim = limit ? `${t ? '&' : '?'}limit=${limit}` : '';
    return (await this.request<any>(`/internet/news${t}${lim}`)) as any;
  }

  async getQuickAnswer(query: string): Promise<any> {
    const q = encodeURIComponent(query);
    return (await this.request<any>(`/internet/quick-answer?q=${q}`)) as any;
  }

  // Automation & Workflows
  async getWorkflows(): Promise<any> {
    return (await this.request<any>('/automation/workflows')) as any;
  }

  async getWorkflow(id: string): Promise<any> {
    return (await this.request<any>(`/automation/workflows/${encodeURIComponent(id)}`)) as any;
  }

  async createWorkflow(data: {
    name: string;
    description?: string;
    trigger?: any;
    steps: any[];
    isActive?: boolean;
  }): Promise<any> {
    return (await this.request<any>('/automation/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    })) as any;
  }

  async toggleWorkflow(id: string, active?: boolean): Promise<any> {
    return (await this.request<any>(`/automation/workflows/${encodeURIComponent(id)}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ active }),
    })) as any;
  }

  async deleteWorkflow(id: string): Promise<any> {
    return (await this.request<any>(`/automation/workflows/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })) as any;
  }

  async runWorkflow(id: string, context?: Record<string, any>): Promise<any> {
    return (await this.request<any>(`/automation/workflows/${encodeURIComponent(id)}/run`, {
      method: 'POST',
      body: JSON.stringify({ context }),
    })) as any;
  }

  async getWorkflowExecutions(): Promise<any> {
    return (await this.request<any>('/automation/executions')) as any;
  }

  async approveWorkflowExecution(id: string): Promise<any> {
    return (await this.request<any>(`/automation/executions/${encodeURIComponent(id)}/approve`, {
      method: 'POST',
    })) as any;
  }

  async cancelWorkflowExecution(id: string): Promise<any> {
    return (await this.request<any>(`/automation/executions/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
    })) as any;
  }

  // Plugin Ecosystem
  async getPlugins(): Promise<any> {
    return (await this.request<any>('/plugins')) as any;
  }

  async getPlugin(id: string): Promise<any> {
    return (await this.request<any>(`/plugins/${encodeURIComponent(id)}`)) as any;
  }

  async togglePlugin(id: string, active?: boolean): Promise<any> {
    return (await this.request<any>(`/plugins/${encodeURIComponent(id)}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ active }),
    })) as any;
  }

  async configurePlugin(id: string, config: Record<string, any>): Promise<any> {
    return (await this.request<any>(`/plugins/${encodeURIComponent(id)}/config`, {
      method: 'PUT',
      body: JSON.stringify({ config }),
    })) as any;
  }

  async installPlugin(manifest: any, config?: Record<string, any>): Promise<any> {
    return (await this.request<any>('/plugins/install', {
      method: 'POST',
      body: JSON.stringify({ manifest, config }),
    })) as any;
  }

  async deletePlugin(id: string): Promise<any> {
    return (await this.request<any>(`/plugins/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })) as any;
  }

  // Multi-Agent Squad & Collaborative Orchestration (Phase 14)
  async getAgentRoles(): Promise<any> {
    return (await this.request<any>('/agents/roles')) as any;
  }

  async planMission(goal: string): Promise<any> {
    return (await this.request<any>('/agents/plan', {
      method: 'POST',
      body: JSON.stringify({ goal }),
    })) as any;
  }

  async executeMission(missionId: string): Promise<any> {
    return (await this.request<any>('/agents/execute', {
      method: 'POST',
      body: JSON.stringify({ missionId }),
    })) as any;
  }

  async runDirectMission(goal: string): Promise<any> {
    return (await this.request<any>('/agents/direct', {
      method: 'POST',
      body: JSON.stringify({ goal }),
    })) as any;
  }

  async getMissions(): Promise<any> {
    return (await this.request<any>('/agents/missions')) as any;
  }

  async getMission(id: string): Promise<any> {
    return (await this.request<any>(`/agents/missions/${encodeURIComponent(id)}`)) as any;
  }

  // DevOps & Deployment Architecture (Phase 15)
  async getDevOpsStatus(): Promise<any> {
    return (await this.request<any>('/devops/status')) as any;
  }

  async createDatabaseBackup(): Promise<any> {
    return (await this.request<any>('/devops/backup', {
      method: 'POST',
    })) as any;
  }
}

export const api = new ApiClient();
