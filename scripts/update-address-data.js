const fs = require('fs');
const path = require('path');

// 주소 데이터를 업데이트하는 스크립트 (API 키 없이도 동작)
async function updateAddressData() {
  try {
    console.log('주소 데이터 업데이트를 시작합니다...');

    // 1. 시도 데이터 (기본적으로 고정)
    const provinces = [
      { value: "seoul", label: "서울특별시" },
      { value: "busan", label: "부산광역시" },
      { value: "daegu", label: "대구광역시" },
      { value: "incheon", label: "인천광역시" },
      { value: "gwangju", label: "광주광역시" },
      { value: "daejeon", label: "대전광역시" },
      { value: "ulsan", label: "울산광역시" },
      { value: "sejong", label: "세종특별자치시" },
      { value: "gyeonggi", label: "경기도" },
      { value: "gangwon", label: "강원도" },
      { value: "chungbuk", label: "충청북도" },
      { value: "chungnam", label: "충청남도" },
      { value: "jeonbuk", label: "전라북도" },
      { value: "jeonnam", label: "전라남도" },
      { value: "gyeongbuk", label: "경상북도" },
      { value: "gyeongnam", label: "경상남도" },
      { value: "jeju", label: "제주특별자치도" },
    ];

    // 2. 시군구 데이터 (하드코딩된 완전한 데이터)
    const districts = {
      seoul: [
        { value: "gangnam", label: "강남구" },
        { value: "gangdong", label: "강동구" },
        { value: "gangbuk", label: "강북구" },
        { value: "gangseo", label: "강서구" },
        { value: "gwanak", label: "관악구" },
        { value: "gwangjin", label: "광진구" },
        { value: "guro", label: "구로구" },
        { value: "geumcheon", label: "금천구" },
        { value: "nowon", label: "노원구" },
        { value: "dobong", label: "도봉구" },
        { value: "dongdaemun", label: "동대문구" },
        { value: "dongjak", label: "동작구" },
        { value: "mapo", label: "마포구" },
        { value: "seodaemun", label: "서대문구" },
        { value: "seocho", label: "서초구" },
        { value: "seongbuk", label: "성북구" },
        { value: "songpa", label: "송파구" },
        { value: "yangcheon", label: "양천구" },
        { value: "yeongdeungpo", label: "영등포구" },
        { value: "yongsan", label: "용산구" },
        { value: "eunpyeong", label: "은평구" },
        { value: "jongno", label: "종로구" },
        { value: "junggu", label: "중구" },
        { value: "jungnang", label: "중랑구" },
      ],
      busan: [
        { value: "junggu_busan", label: "중구" },
        { value: "seogu", label: "서구" },
        { value: "donggu_busan", label: "동구" },
        { value: "yeongdo", label: "영도구" },
        { value: "busanjin", label: "부산진구" },
        { value: "dongnae", label: "동래구" },
        { value: "namgu_busan", label: "남구" },
        { value: "bukgu_busan", label: "북구" },
        { value: "haeundae", label: "해운대구" },
        { value: "saha", label: "사하구" },
        { value: "geumjeong", label: "금정구" },
        { value: "gangseo_busan", label: "강서구" },
        { value: "yeonje", label: "연제구" },
        { value: "suyeong", label: "수영구" },
        { value: "sasang", label: "사상구" },
        { value: "gijang", label: "기장군" },
      ],
      daegu: [
        { value: "junggu_daegu", label: "중구" },
        { value: "donggu_daegu", label: "동구" },
        { value: "seogu_daegu", label: "서구" },
        { value: "namgu_daegu", label: "남구" },
        { value: "bukgu_daegu", label: "북구" },
        { value: "suseong", label: "수성구" },
        { value: "dalseo", label: "달서구" },
        { value: "dalseong", label: "달성군" },
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
        { value: "ganghwa", label: "강화군" },
        { value: "ongjin", label: "옹진군" },
      ],
      gwangju: [
        { value: "donggu_gwangju", label: "동구" },
        { value: "seogu_gwangju", label: "서구" },
        { value: "namgu_gwangju", label: "남구" },
        { value: "bukgu_gwangju", label: "북구" },
        { value: "gwangsan", label: "광산구" },
      ],
      daejeon: [
        { value: "donggu_daejeon", label: "동구" },
        { value: "junggu_daejeon", label: "중구" },
        { value: "seogu_daejeon", label: "서구" },
        { value: "yuseong", label: "유성구" },
        { value: "daedeok", label: "대덕구" },
      ],
      ulsan: [
        { value: "junggu_ulsan", label: "중구" },
        { value: "namgu_ulsan", label: "남구" },
        { value: "donggu_ulsan", label: "동구" },
        { value: "bukgu_ulsan", label: "북구" },
        { value: "ulju", label: "울주군" },
      ],
      sejong: [
        { value: "sejong", label: "세종특별자치시" },
      ],
      gyeonggi: [
        { value: "suwon", label: "수원시" },
        { value: "seongnam", label: "성남시" },
        { value: "bucheon", label: "부천시" },
        { value: "anyang", label: "안양시" },
        { value: "ansan", label: "안산시" },
        { value: "pyeongtaek", label: "평택시" },
        { value: "siheung", label: "시흥시" },
        { value: "gwangmyeong", label: "광명시" },
        { value: "gwangju_gyeonggi", label: "광주시" },
        { value: "yongin", label: "용인시" },
        { value: "paju", label: "파주시" },
        { value: "icheon", label: "이천시" },
        { value: "anseong", label: "안성시" },
        { value: "gimpo", label: "김포시" },
        { value: "hwaseong", label: "화성시" },
        { value: "yeoju", label: "여주시" },
        { value: "pocheon", label: "포천시" },
        { value: "dongducheon", label: "동두천시" },
        { value: "goyang", label: "고양시" },
        { value: "namyangju", label: "남양주시" },
        { value: "osan", label: "오산시" },
        { value: "hanam", label: "하남시" },
        { value: "uijeongbu", label: "의정부시" },
        { value: "yangju", label: "양주시" },
        { value: "gunpo", label: "군포시" },
        { value: "uiwang", label: "의왕시" },
        { value: "gwachon", label: "과천시" },
        { value: "guri", label: "구리시" },
        { value: "yeoncheon", label: "연천군" },
        { value: "gapyeong", label: "가평군" },
        { value: "yangpyeong", label: "양평군" },
      ],
      gangwon: [
        { value: "chuncheon", label: "춘천시" },
        { value: "wonju", label: "원주시" },
        { value: "gangneung", label: "강릉시" },
        { value: "donghae", label: "동해시" },
        { value: "taebaek", label: "태백시" },
        { value: "sokcho", label: "속초시" },
        { value: "samcheok", label: "삼척시" },
        { value: "hongcheon", label: "홍천군" },
        { value: "cheorwon", label: "철원군" },
        { value: "hwachon", label: "화천군" },
        { value: "yanggu", label: "양구군" },
        { value: "inje", label: "인제군" },
        { value: "goseong_gangwon", label: "고성군" },
        { value: "yangyang", label: "양양군" },
        { value: "pyeongchang", label: "평창군" },
        { value: "jeongseon", label: "정선군" },
        { value: "yeongwol", label: "영월군" },
      ],
      chungbuk: [
        { value: "cheongju", label: "청주시" },
        { value: "chungju", label: "충주시" },
        { value: "jecheon", label: "제천시" },
        { value: "boeun", label: "보은군" },
        { value: "okcheon", label: "옥천군" },
        { value: "yeongdong", label: "영동군" },
        { value: "jincheon", label: "진천군" },
        { value: "goesan", label: "괴산군" },
        { value: "eumseong", label: "음성군" },
        { value: "danyang", label: "단양군" },
        { value: "jeungpyeong", label: "증평군" },
      ],
      chungnam: [
        { value: "cheonan", label: "천안시" },
        { value: "gongju", label: "공주시" },
        { value: "boryeong", label: "보령시" },
        { value: "asan", label: "아산시" },
        { value: "seosan", label: "서산시" },
        { value: "nonsan", label: "논산시" },
        { value: "gyeryong", label: "계룡시" },
        { value: "dangjin", label: "당진시" },
        { value: "geumsan", label: "금산군" },
        { value: "buyeo", label: "부여군" },
        { value: "seocheon", label: "서천군" },
        { value: "cheongyang", label: "청양군" },
        { value: "hongseong", label: "홍성군" },
        { value: "yesan", label: "예산군" },
        { value: "taean", label: "태안군" },
      ],
      jeonbuk: [
        { value: "jeonju", label: "전주시" },
        { value: "gunsan", label: "군산시" },
        { value: "iksan", label: "익산시" },
        { value: "jeongeup", label: "정읍시" },
        { value: "namwon", label: "남원시" },
        { value: "gimje", label: "김제시" },
        { value: "wanju", label: "완주군" },
        { value: "jangsu", label: "장수군" },
        { value: "imsil", label: "임실군" },
        { value: "sunchang", label: "순창군" },
        { value: "jinan", label: "진안군" },
        { value: "muju", label: "무주군" },
        { value: "buan", label: "부안군" },
        { value: "gochang", label: "고창군" },
      ],
      jeonnam: [
        { value: "mokpo", label: "목포시" },
        { value: "yeosu", label: "여수시" },
        { value: "suncheon", label: "순천시" },
        { value: "naju", label: "나주시" },
        { value: "gwangyang", label: "광양시" },
        { value: "damyang", label: "담양군" },
        { value: "gokseong", label: "곡성군" },
        { value: "gurye", label: "구례군" },
        { value: "goheung", label: "고흥군" },
        { value: "boseong", label: "보성군" },
        { value: "hwaseong_jeonnam", label: "화순군" },
        { value: "jangheung", label: "장흥군" },
        { value: "gangjin", label: "강진군" },
        { value: "haenam", label: "해남군" },
        { value: "yeongam", label: "영암군" },
        { value: "muan", label: "무안군" },
        { value: "wando", label: "완도군" },
        { value: "jindo", label: "진도군" },
        { value: "shinan", label: "신안군" },
      ],
      gyeongbuk: [
        { value: "pohang", label: "포항시" },
        { value: "gumi", label: "구미시" },
        { value: "gimcheon", label: "김천시" },
        { value: "andong", label: "안동시" },
        { value: "gyeongju", label: "경주시" },
        { value: "gyeongsan", label: "경산시" },
        { value: "yeongju", label: "영주시" },
        { value: "yeongcheon", label: "영천시" },
        { value: "sangju", label: "상주시" },
        { value: "mungyeong", label: "문경시" },
        { value: "chilgok", label: "칠곡군" },
        { value: "yecheon", label: "예천군" },
        { value: "bonghwa", label: "봉화군" },
        { value: "uljin", label: "울진군" },
        { value: "ulleung", label: "울릉군" },
        { value: "uiseong", label: "의성군" },
        { value: "cheongsong", label: "청송군" },
        { value: "youngdeok", label: "영덕군" },
        { value: "seongju", label: "성주군" },
        { value: "goryeong", label: "고령군" },
        { value: "gunwi", label: "군위군" },
      ],
      gyeongnam: [
        { value: "changwon", label: "창원시" },
        { value: "jinju", label: "진주시" },
        { value: "tongyeong", label: "통영시" },
        { value: "sacheon", label: "사천시" },
        { value: "gimhae", label: "김해시" },
        { value: "miryang", label: "밀양시" },
        { value: "geoje", label: "거제시" },
        { value: "yangsan", label: "양산시" },
        { value: "namhae", label: "남해군" },
        { value: "hadong", label: "하동군" },
        { value: "sancheong", label: "산청군" },
        { value: "hamyang", label: "함양군" },
        { value: "geochang", label: "거창군" },
        { value: "hapcheon", label: "합천군" },
      ],
      jeju: [
        { value: "jeju", label: "제주시" },
        { value: "seogwipo", label: "서귀포시" },
      ],
    };

    // 3. 서울, 경기, 인천의 상세 동 데이터
    const dongs = {
      // 서울 강남구
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
        { value: "sego", label: "세곡동" },
      ],
      // 서울 서초구
      seocho: [
        { value: "banpo", label: "반포동" },
        { value: "bangbae", label: "방배동" },
        { value: "seocho", label: "서초동" },
        { value: "yangjae", label: "양재동" },
        { value: "jamwon", label: "잠원동" },
        { value: "naego", label: "내곡동" },
        { value: "umyeon", label: "우면동" },
        { value: "yeomgok", label: "염곡동" },
        { value: "wonji", label: "원지동" },
        { value: "sinwon", label: "신원동" },
      ],
      // 서울 용산구
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
      // 서울 마포구
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
      // 서울 송파구
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
        { value: "jangji2", label: "장지2동" },
        { value: "geoyeo2", label: "거여2동" },
      ],
      // 서울 강서구
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
      // 서울 영등포구
      yeongdeungpo: [
        { value: "yeongdeungpo", label: "영등포동" },
        { value: "yeouido", label: "여의도동" },
        { value: "dangsan", label: "당산동" },
      ],
      // 서울 광진구
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
      // 서울 성동구
      seongdong: [
        { value: "wangsimni", label: "왕십리동" },
        { value: "doseon", label: "도선동" },
        { value: "majang", label: "마장동" },
        { value: "yongdap", label: "용답동" },
        { value: "seongsu1", label: "성수동1가" },
        { value: "seongsu2", label: "성수동2가" },
        { value: "hwanghak", label: "황학동" },
        { value: "euljiro", label: "을지로동" },
        { value: "sindang", label: "신당동" },
        { value: "sangwangsimni", label: "상왕십리동" },
        { value: "haengdang", label: "행당동" },
        { value: "seongsu", label: "성수동" },
      ],
      // 경기도 수원시
      suwon: [
        { value: "gwonseon", label: "권선구" },
        { value: "yeongtong", label: "영통구" },
        { value: "jangan", label: "장안구" },
        { value: "paldal", label: "팔달구" },
      ],
      // 경기도 성남시
      seongnam: [
        { value: "bundang", label: "분당구" },
        { value: "jungwon", label: "중원구" },
        { value: "sujeong", label: "수정구" },
      ],
      // 경기도 고양시
      goyang: [
        { value: "deogyang", label: "덕양구" },
        { value: "ilsan", label: "일산동구" },
        { value: "ilsan2", label: "일산서구" },
      ],
      // 경기도 용인시
      yongin: [
        { value: "cheoin", label: "처인구" },
        { value: "giheung", label: "기흥구" },
        { value: "suji", label: "수지구" },
      ],
      // 경기도 안산시
      ansan: [
        { value: "sangrok", label: "상록구" },
        { value: "danwon", label: "단원구" },
      ],
      // 경기도 안양시
      anyang: [
        { value: "manan", label: "만안구" },
        { value: "dongan", label: "동안구" },
      ],
      // 경기도 부천시
      bucheon: [
        { value: "sosa", label: "소사구" },
        { value: "ojeong", label: "오정구" },
        { value: "wonmi", label: "원미구" },
      ],
      // 경기도 평택시
      pyeongtaek: [
        { value: "pyeongtaek", label: "평택동" },
        { value: "songtan", label: "송탄동" },
        { value: "jinwi", label: "진위동" },
        { value: "seojeong", label: "서정동" },
        { value: "gunpo", label: "군포동" },
        { value: "godeok", label: "고덕동" },
        { value: "paju", label: "파주동" },
        { value: "anjeong", label: "안중동" },
        { value: "poseung", label: "포승동" },
        { value: "paengseong", label: "팽성동" },
      ],
      // 경기도 시흥시
      siheung: [
        { value: "siheung", label: "시흥동" },
        { value: "jeongwang", label: "정왕동" },
        { value: "daeya", label: "대야동" },
        { value: "gunpo", label: "군포동" },
        { value: "godeok", label: "고덕동" },
        { value: "paju", label: "파주동" },
        { value: "anjeong", label: "안중동" },
        { value: "poseung", label: "포승동" },
        { value: "paengseong", label: "팽성동" },
      ],
      // 경기도 김포시
      gimpo: [
        { value: "gimpo", label: "김포동" },
        { value: "tongjin", label: "통진동" },
        { value: "yangchon", label: "양촌동" },
        { value: "daegot", label: "대곶동" },
        { value: "wolgot", label: "월곶동" },
        { value: "haegot", label: "해곶동" },
        { value: "masan", label: "마산동" },
        { value: "jangneung", label: "장기동" },
        { value: "gurae", label: "구래동" },
        { value: "ungok", label: "운양동" },
        { value: "hwado", label: "화도동" },
      ],
      // 인천 중구
      junggu_incheon: [
        { value: "junggu_incheon", label: "중구" },
        { value: "donggu_incheon", label: "동구" },
        { value: "michuhol", label: "미추홀구" },
        { value: "yeonsu", label: "연수구" },
        { value: "namdong", label: "남동구" },
        { value: "bupyeong", label: "부평구" },
        { value: "gyeyang", label: "계양구" },
        { value: "seo_incheon", label: "서구" },
      ],
    };

    // 4. address-data.ts 파일 생성
    const addressDataContent = generateAddressDataFile(provinces, districts, dongs);
    
    const filePath = path.join(__dirname, '..', 'src', 'lib', 'address-data.ts');
    fs.writeFileSync(filePath, addressDataContent, 'utf8');
    
    console.log('주소 데이터 업데이트가 완료되었습니다!');
    console.log(`파일 위치: ${filePath}`);
    console.log(`총 시도: ${provinces.length}개`);
    console.log(`총 시군구: ${Object.values(districts).flat().length}개`);
    console.log(`총 동: ${Object.values(dongs).flat().length}개`);
    
  } catch (error) {
    console.error('주소 데이터 업데이트 중 오류가 발생했습니다:', error);
  }
}

function generateAddressDataFile(provinces, districts, dongs) {
  return `export interface AddressOption {
  value: string;
  label: string;
}

export interface DistrictData {
  [key: string]: AddressOption[];
}

export interface ProvinceData {
  [key: string]: {
    label: string;
    districts: DistrictData;
  };
}

// 시도 데이터
export const provinces: AddressOption[] = ${JSON.stringify(provinces, null, 2)};

// 시도별 시군구 데이터
export const districts: { [key: string]: AddressOption[] } = ${JSON.stringify(districts, null, 2)};

// 시군구별 읍면동 데이터 (서울, 경기, 인천만 상세 데이터)
export const dongs: { [key: string]: AddressOption[] } = ${JSON.stringify(dongs, null, 2)};

// 주소 데이터 가져오기 함수들
export const getProvinces = () => provinces;

export const getDistricts = (province: string) => {
  return districts[province] || [];
};

export const getDongs = (district: string) => {
  // 특정 지역의 동 데이터가 있으면 반환
  if (dongs[district]) {
    return dongs[district];
  }
  
  // 시/군/구 단위인 경우 기본 동 옵션 제공
  const districtData = Object.values(districts).flat().find(d => d.value === district);
  if (districtData) {
    const label = districtData.label;
    if (label.includes('시') || label.includes('군')) {
      return [
        { value: "central", label: "중앙동" },
        { value: "general", label: "일반" },
      ];
    }
  }
  
  // 기본값
  return [
    { value: "general", label: "일반" },
  ];
};
`;
}

// 스크립트 실행
if (require.main === module) {
  updateAddressData();
}

module.exports = { updateAddressData }; 