import axios from 'axios';

// back, front서로 경로가 다르면 cookie를 보내줄 수 없다 이 문제를 해결하기 위해서
// withCredentials: true로 맞춰줌 (2번째 자리)
const fetcher = (url: string) => (
  axios
    .get(url, {
      withCredentials: true,
    })
    .then((response) => response.data));

export default fetcher;
