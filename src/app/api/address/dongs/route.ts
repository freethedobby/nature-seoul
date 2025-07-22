import { NextRequest, NextResponse } from 'next/server';

interface AddressOption {
  value: string;
  label: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const district = searchParams.get('district');
  const province = searchParams.get('province');

  if (!district || !province) {
    return NextResponse.json({ error: 'District and province parameters are required' }, { status: 400 });
  }

  try {
    // 서울, 경기, 인천만 동 데이터 제공
    const detailedProvinces = ['seoul', 'gyeonggi', 'incheon'];
    if (!detailedProvinces.includes(province)) {
      return NextResponse.json({ 
        dongs: [
          { value: "central", label: "중앙동" },
          { value: "general", label: "일반" },
        ] 
      });
    }

    // 공공데이터포털 도로명주소 API 또는 다른 주소 API 사용
    // 실제 구현에서는 API 키와 엔드포인트를 설정해야 함
    const response = await fetch(
      `https://api.vworld.kr/req/data?service=data&request=GetFeature&data=LT_C_ADEMD_INFO&key=YOUR_API_KEY&domain=localhost:3000&format=json&size=1000&attrFilter=sig_kor_nm:like:${district}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from address API');
    }

    const data = await response.json();
    
    // API 응답을 파싱하여 dongs 배열로 변환
    const dongs = data.response?.service?.result?.items || [];
    
    return NextResponse.json({ dongs });
  } catch (error) {
    console.error('Error fetching dongs:', error);
    
    // API 실패 시 기본 데이터 반환
    const defaultDongs = getDefaultDongs(district, province);
    return NextResponse.json({ dongs: defaultDongs });
  }
}

function getDefaultDongs(district: string, province: string) {
  // 서울, 경기, 인천만 기본 동 데이터 제공
  const detailedProvinces = ['seoul', 'gyeonggi', 'incheon'];
  if (!detailedProvinces.includes(province)) {
    return [
      { value: "central", label: "중앙동" },
      { value: "general", label: "일반" },
    ];
  }

  const defaultDongs: { [key: string]: AddressOption[] } = {
    gangnam: [
      { value: "apgujeong", label: "압구정동" },
      { value: "cheongdam", label: "청담동" },
      { value: "daechi", label: "대치동" },
      { value: "dogok", label: "도곡동" },
      { value: "gaepo", label: "개포동" },
      { value: "irwon", label: "일원동" },
      { value: "nonhyeon", label: "논현동" },
      { value: "samseong", label: "삼성동" },
      { value: "sinsa", label: "신사동" },
      { value: "suseo", label: "수서동" },
    ],
    seocho: [
      { value: "banpo", label: "반포동" },
      { value: "bangbae", label: "방배동" },
      { value: "seocho", label: "서초동" },
      { value: "yangjae", label: "양재동" },
      { value: "jamwon", label: "잠원동" },
    ],
    yongsan: [
      { value: "cheongpa", label: "청파동" },
      { value: "hyochang", label: "효창동" },
      { value: "yongmun", label: "용문동" },
      { value: "hangangno", label: "한강로동" },
      { value: "ichon", label: "이촌동" },
      { value: "seobinggo", label: "서빙고동" },
      { value: "hannam", label: "한남동" },
      { value: "huam", label: "후암동" },
      { value: "munbae", label: "문배동" },
      { value: "wonhyo", label: "원효로동" },
      { value: "seongsu", label: "성수동" },
      { value: "gongdeok", label: "공덕동" },
      { value: "sinchon", label: "신촌동" },
      { value: "sangam", label: "상암동" },
    ],
    mapo: [
      { value: "gongdeok", label: "공덕동" },
      { value: "dohwa", label: "도화동" },
      { value: "sinsu", label: "신수동" },
      { value: "ahyeon", label: "아현동" },
      { value: "yeonnam", label: "연남동" },
      { value: "seogyo", label: "서교동" },
      { value: "sangsu", label: "상수동" },
      { value: "seongsan", label: "성산동" },
      { value: "hapjeong", label: "합정동" },
      { value: "mangwon", label: "망원동" },
      { value: "seongmisan", label: "성미산동" },
      { value: "daeheung", label: "대흥동" },
      { value: "nogyang", label: "노고산동" },
      { value: "changjeon", label: "창전동" },
      { value: "seongam", label: "상암동" },
    ],
    songpa: [
      { value: "jamsil", label: "잠실동" },
      { value: "songpa", label: "송파동" },
      { value: "sokchon", label: "석촌동" },
      { value: "samjeon", label: "삼전동" },
      { value: "garak", label: "가락동" },
      { value: "munjeong", label: "문정동" },
      { value: "jangji", label: "장지동" },
      { value: "geoyeo", label: "거여동" },
      { value: "macheon", label: "마천동" },
    ],
    gangseo: [
      { value: "gayang", label: "가양동" },
      { value: "gonghang", label: "공항동" },
      { value: "banghwa", label: "방화동" },
      { value: "hwagok", label: "화곡동" },
      { value: "gangseo", label: "강서동" },
      { value: "oegeum", label: "외발산동" },
      { value: "naegeum", label: "내발산동" },
      { value: "deungchon", label: "등촌동" },
      { value: "ujung", label: "우장산동" },
    ],
    yeongdeungpo: [
      { value: "yeongdeungpo", label: "영등포동" },
      { value: "yeouido", label: "여의도동" },
      { value: "dangsan", label: "당산동" },
    ],
    gwangjin: [
      { value: "gwangjang", label: "광장동" },
      { value: "guui", label: "구의동" },
      { value: "gunchon", label: "군자동" },
      { value: "neungdong", label: "능동" },
      { value: "jayang", label: "자양동" },
      { value: "hwayang", label: "화양동" },
      { value: "seongsu", label: "성수동" },
      { value: "seongsu2", label: "성수2동" },
      { value: "seongsu3", label: "성수3동" },
    ],
    seongdong: [
      { value: "wangsimni", label: "왕십리동" },
      { value: "wangsimni2", label: "왕십리2동" },
      { value: "wangsimni3", label: "왕십리3동" },
      { value: "wangsimni4", label: "왕십리4동" },
      { value: "wangsimni5", label: "왕십리5동" },
      { value: "wangsimni6", label: "왕십리6동" },
      { value: "wangsimni7", label: "왕십리7동" },
      { value: "wangsimni8", label: "왕십리8동" },
      { value: "wangsimni9", label: "왕십리9동" },
      { value: "wangsimni10", label: "왕십리10동" },
      { value: "wangsimni11", label: "왕십리11동" },
      { value: "wangsimni12", label: "왕십리12동" },
      { value: "wangsimni13", label: "왕십리13동" },
      { value: "wangsimni14", label: "왕십리14동" },
      { value: "wangsimni15", label: "왕십리15동" },
    ],
    default: [
      { value: "central", label: "중앙동" },
      { value: "general", label: "일반" },
    ]
  };
  
  return defaultDongs[district] || defaultDongs.default;
} 