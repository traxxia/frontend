export class ExcelAnalysisService {
  constructor(ML_API_BASE_URL, getAuthToken, setApiLoading) {
    this.ML_API_BASE_URL = ML_API_BASE_URL;
    this.getAuthToken = getAuthToken;
    this.setApiLoading = setApiLoading;
  }

  async generateExcelAnalysis(uploadedFile, questions, userAnswers, metricType = null, businessId = null) {
    this.setApiLoading('excel-analysis', true);

    try {
      const formData = new FormData();

      if (uploadedFile) {
        formData.append('file', uploadedFile);
      } else {
        const questionsArray = [];
        const answersArray = [];

        questions
          .filter(q => userAnswers[q._id] && userAnswers[q._id].trim())
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .forEach(question => {
            questionsArray.push(question.question_text);
            answersArray.push(userAnswers[question._id]);
          });

        const businessInfo = `Business Information:\n${questionsArray.map((q, i) => `${q}: ${answersArray[i]}`).join('\n')}`;
        const dummyFile = new Blob([businessInfo], { type: 'text/plain' });
        formData.append('file', dummyFile, 'business_data.txt');
      }
      let url = `${this.ML_API_BASE_URL}/excel-analysis`;
      const params = new URLSearchParams();

      if (metricType) {
        params.append('metric_type', metricType);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      // Build observatory headers
      const customHeaders = {
        'accept': 'application/json',
        'source': 'simple'
      };
      try {
        const authState = JSON.parse(
          sessionStorage.getItem('auth-storage') || localStorage.getItem('auth-storage') || '{}'
        );
        const isObservatory = authState?.state?.isObservatory === true;
        customHeaders['x-is-observatory'] = isObservatory ? 'true' : 'false';
        if (businessId) {
          customHeaders['x-business-id'] = String(businessId);
        }
      } catch (_) {}

      const response = await fetch(url, {
        method: 'POST',
        headers: customHeaders,
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error('Error generating excel analysis:', error);
      throw error;
    } finally {
      this.setApiLoading('excel-analysis', false);
    }
  }
}
