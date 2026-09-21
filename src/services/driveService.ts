import { getAccessToken } from './authService';

export interface BackupData {
  version: string;
  timestamp: string;
  userEmail?: string;
  voiceEnrollments: {
    slotNumber: number;
    phrase: string;
    isEnrolled: boolean;
    recordedAt?: string;
    rmsLevel: number;
    embeddingVector: number[];
  }[];
  longTermMemory: {
    id: string;
    content: string;
    category: string;
    createdAt: string;
    isPinned?: boolean;
  }[];
  securityAuditLogs: {
    id: string;
    toolName: string;
    riskLevel: string;
    status: string;
    authState: string;
    similarityScore: number;
    timestamp: string;
  }[];
  settings: {
    personality: string;
    voiceAuthThreshold: number;
    isPinConfigured: boolean;
  };
}

const BACKUP_FILE_NAME = 'MYRA_v2.2.3_Backup.json';

export async function findDriveBackupFile(token: string): Promise<{ id: string; modifiedTime: string; size: string } | null> {
  const query = encodeURIComponent(`name = '${BACKUP_FILE_NAME}' and trashed = false`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime,size)&pageSize=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to query Google Drive: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }
  return null;
}

export async function saveBackupToDrive(backupData: BackupData): Promise<{ fileId: string; modifiedTime: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Google Drive access token not available. Please sign in with Google first.');
  }

  const existingFile = await findDriveBackupFile(token);
  const fileContent = JSON.stringify(backupData, null, 2);

  if (existingFile) {
    // Update existing file content
    const updateRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: fileContent,
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.text();
      throw new Error(`Failed to update backup file on Drive: ${err}`);
    }

    const updated = await updateRes.json();
    return {
      fileId: updated.id || existingFile.id,
      modifiedTime: new Date().toISOString(),
    };
  } else {
    // Create new multipart file
    const metadata = {
      name: BACKUP_FILE_NAME,
      mimeType: 'application/json',
      description: 'MYRA v2.2.3 Secure System & Voice Profiles Backup',
    };

    const boundary = '-------MYRABackupBoundary' + Math.random().toString(36).substring(2);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const createRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartRequestBody,
      }
    );

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Failed to upload backup to Google Drive: ${err}`);
    }

    const created = await createRes.json();
    return {
      fileId: created.id,
      modifiedTime: new Date().toISOString(),
    };
  }
}

export async function restoreBackupFromDrive(): Promise<BackupData> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Google Drive access token not available. Please sign in with Google first.');
  }

  const existingFile = await findDriveBackupFile(token);
  if (!existingFile) {
    throw new Error(`No backup file found on Google Drive with name "${BACKUP_FILE_NAME}".`);
  }

  const downloadRes = await fetch(
    `https://www.googleapis.com/drive/v3/files/${existingFile.id}?alt=media`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!downloadRes.ok) {
    const err = await downloadRes.text();
    throw new Error(`Failed to download backup file from Drive: ${err}`);
  }

  const backupData: BackupData = await downloadRes.json();
  return backupData;
}
