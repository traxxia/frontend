import { BaseApiService } from './BaseApiService';

export class MlApiService extends BaseApiService {
  constructor(baseUrl) {
    super(baseUrl);
  }

  async makeAPICall(endpoint, payload, onStreamChunk = null) {
    const headers = this.getCommonHeaders();
    
    // Add specific ML headers if needed
    if (['find', 'pestel-analysis', 'full-swot-portfolio', 'porter-analysis'].includes(endpoint)) {
      headers['deep_search'] = 'true';
    }

    const response = await fetch(`${this.baseUrl}/${endpoint}?stream=true`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${endpoint} API returned ${response.status}: ${errorText}`);
    }

    if (response.body && onStreamChunk) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          onStreamChunk(buffer);
        }
        done = readerDone;
      }
      
      try {
        const jsonStart = buffer.indexOf('{');
        const jsonEnd = buffer.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
          const jsonString = buffer.slice(jsonStart, jsonEnd + 1);
          return JSON.parse(jsonString);
        }
      } catch (err) {
        console.warn('Error parsing JSON stream:', err);
      }
      return { raw: buffer };
    }

    return await response.json();
  }
}
