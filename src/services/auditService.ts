import { apiClient } from '../api/client';

export interface AuditLog {
  id: number;
  user_id: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface AuditFilters {
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}

class AuditService {
  /**
   * Fetch audit logs with optional filters
   */
  async fetchAuditLogs(filters: AuditFilters = {}): Promise<{ logs: AuditLog[]; total: number }> {
    try {
      const params = new URLSearchParams();
      
      if (filters.action) params.append('action', filters.action);
      if (filters.entity_type) params.append('entity_type', filters.entity_type);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.offset) params.append('offset', filters.offset.toString());

      const queryString = params.toString();
      const url = `/audit/logs${queryString ? `?${queryString}` : ''}`;
      
      const data = await apiClient.get<{ logs: AuditLog[]; total: number }>(url);
      
      return {
        logs: data.logs || [],
        total: data.total || 0
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async fetchAuditStats(): Promise<any> {
    try {
      const data = await apiClient.get('/audit/stats');
      return data;
    } catch (error) {
      console.error('Error fetching audit stats:', error);
      throw error;
    }
  }

  /**
   * Export audit logs as CSV
   */
  exportLogsAsCSV(logs: AuditLog[]): void {
    const headers = ['ID', 'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details'];
    const rows = logs.map(log => [
      log.id,
      new Date(log.timestamp).toLocaleString(),
      log.user_email || log.user_id,
      log.action,
      log.entity_type,
      log.entity_id || '',
      log.details || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}

export default new AuditService();
