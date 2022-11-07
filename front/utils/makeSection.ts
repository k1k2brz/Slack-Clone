import { IChat, IDM } from '@typings/db';
import dayjs from 'dayjs';

export default function makeSection(chatList: (IDM | IChat)[]) {
  const sections: { [key: string]: (IDM | IChat)[] } = {};
  chatList.forEach((chat) => {
    // 날짜 연월일 형식 추출
    const monthDate = dayjs(chat.createdAt).format('YYYY-MM-DD');
    // 이미 뭔가를 만든 경우
    if (Array.isArray(sections[monthDate])) {
      sections[monthDate].push(chat);
    } else {
      sections[monthDate] = [chat];
    }
  });
  return sections;
}
