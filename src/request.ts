import axios from "axios";
import https from "https";

const agent = new https.Agent({
  rejectUnauthorized: false, // SSL 인증서 검증 무시
});

// * Request
const requestGet = async ({ url, params, config }: { url: string; params?: any; config?: any }) => {
  const response = await axios.get(url, { httpsAgent: agent });
  return response.data;
};

// * Request POST
const requestPost = async ({ url, data, config }: { url: string; data?: any; config?: any }): Promise<any> => {
  try {
    const response = await axios.post(url, data, {
      httpsAgent: agent,
      ...config,
    });
    return response.data;
  } catch (error) {
    console.error(`Error posting data to ${url}:`, error);
    throw error;
  }
};

// * Request PATCH
const requestPatch = async ({ url, data, config }: { url: string; data?: any; config?: any }): Promise<any> => {
  try {
    const response = await axios.patch(url, data, {
      httpsAgent: agent,
      ...config,
    });
    return response.data;
  } catch (error) {
    console.error(`Error patching data to ${url}:`, error);
    throw error;
  }
};

// * Request DELETE
const requestDelete = async ({ url, config }: { url: string; config?: any }): Promise<any> => {
  try {
    const response = await axios.delete(url, {
      httpsAgent: agent,
      ...config,
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting data from ${url}:`, error);
    throw error;
  }
};

// * Request UPSERT
const requestUpsert = async ({ url, data, config }: { url: string; data?: any; config?: any }): Promise<any> => {
  try {
    const response = await axios.put(url, data, {
      httpsAgent: agent,
      ...config,
    });
    return response.data;
  } catch (error) {
    console.error(`Error upserting data to ${url}:`, error);
    throw error;
  }
};

// * Graphql
// query = { dailys(date: ${date}) { id state patientInfo { name age sex } } }
// values = {date: "20240418"}
const gqlWithValues = (query: string | undefined, values: any) => {
  return !query ? query : query.replace(/\$\{?(\w+)\}?/g, (match: any, key) => values[key] || match); // 키에 해당하는 값이 없다면, 매치된 문자열 그대로 반환
};

const requestGql = async ({ url, query, values, config }: { url: string; query?: string; values?: any; config?: any }) => {
  query = gqlWithValues(query, values);
  const response = await axios.post(url, { query }, { httpsAgent: agent });
  return response.data;
};

export { requestGet, requestPost, requestPatch, requestDelete, requestUpsert, requestGql };
