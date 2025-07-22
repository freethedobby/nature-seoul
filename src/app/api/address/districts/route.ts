import { NextRequest, NextResponse } from 'next/server';

interface AddressOption {
  value: string;
  label: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get('province');

  if (!province) {
    return NextResponse.json({ error: 'Province parameter is required' }, { status: 400 });
  }

  try {
    // 공공데이터포털 도로명주소 API 또는 다른 주소 API 사용
    // 실제 구현에서는 API 키와 엔드포인트를 설정해야 함
    const response = await fetch(
      `https://api.vworld.kr/req/data?service=data&request=GetFeature&data=LT_C_ADSIGG_INFO&key=YOUR_API_KEY&domain=localhost:3000&format=json&size=1000&attrFilter=sig_kor_nm:like:${province}`,
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
    
    // API 응답을 파싱하여 districts 배열로 변환
    const districts = data.response?.service?.result?.items || [];
    
    return NextResponse.json({ districts });
  } catch (error) {
    console.error('Error fetching districts:', error);
    
    // API 실패 시 기본 데이터 반환
    const defaultDistricts = getDefaultDistricts(province);
    return NextResponse.json({ districts: defaultDistricts });
  }
}

function getDefaultDistricts(province: string) {
  const defaultDistricts: { [key: string]: AddressOption[] } = {
    seoul: [
      { value: "gangnam", label: "강남구" },
      { value: "seocho", label: "서초구" },
      { value: "yongsan", label: "용산구" },
      { value: "mapo", label: "마포구" },
      { value: "songpa", label: "송파구" },
      { value: "gangseo", label: "강서구" },
      { value: "yeongdeungpo", label: "영등포구" },
      { value: "gwangjin", label: "광진구" },
      { value: "seongdong", label: "성동구" },
    ],
    gyeonggi: [
      { value: "suwon", label: "수원시" },
      { value: "seongnam", label: "성남시" },
      { value: "goyang", label: "고양시" },
      { value: "yongin", label: "용인시" },
      { value: "ansan", label: "안산시" },
      { value: "anyang", label: "안양시" },
      { value: "bucheon", label: "부천시" },
      { value: "pyeongtaek", label: "평택시" },
      { value: "siheung", label: "시흥시" },
      { value: "gimpo", label: "김포시" },
    ],
    incheon: [
      { value: "junggu_incheon", label: "중구" },
      { value: "donggu", label: "동구" },
      { value: "michuhol", label: "미추홀구" },
      { value: "yeonsu", label: "연수구" },
      { value: "namdong", label: "남동구" },
      { value: "bupyeong", label: "부평구" },
      { value: "gyeyang", label: "계양구" },
      { value: "seo_incheon", label: "서구" },
    ],
    default: [
      { value: "central", label: "중앙구" },
      { value: "general", label: "일반" },
    ]
  };
  
  return defaultDistricts[province] || defaultDistricts.default;
} 