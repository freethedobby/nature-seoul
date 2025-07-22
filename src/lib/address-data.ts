export interface AddressOption {
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
export const provinces: AddressOption[] = [
  {
    "value": "seoul",
    "label": "서울특별시"
  },
  {
    "value": "busan",
    "label": "부산광역시"
  },
  {
    "value": "daegu",
    "label": "대구광역시"
  },
  {
    "value": "incheon",
    "label": "인천광역시"
  },
  {
    "value": "gwangju",
    "label": "광주광역시"
  },
  {
    "value": "daejeon",
    "label": "대전광역시"
  },
  {
    "value": "ulsan",
    "label": "울산광역시"
  },
  {
    "value": "sejong",
    "label": "세종특별자치시"
  },
  {
    "value": "gyeonggi",
    "label": "경기도"
  },
  {
    "value": "gangwon",
    "label": "강원도"
  },
  {
    "value": "chungbuk",
    "label": "충청북도"
  },
  {
    "value": "chungnam",
    "label": "충청남도"
  },
  {
    "value": "jeonbuk",
    "label": "전라북도"
  },
  {
    "value": "jeonnam",
    "label": "전라남도"
  },
  {
    "value": "gyeongbuk",
    "label": "경상북도"
  },
  {
    "value": "gyeongnam",
    "label": "경상남도"
  },
  {
    "value": "jeju",
    "label": "제주특별자치도"
  }
];

// 시도별 시군구 데이터
export const districts: { [key: string]: AddressOption[] } = {
  "seoul": [
    {
      "value": "jongno",
      "label": "종로구"
    },
    {
      "value": "junggu",
      "label": "중구"
    },
    {
      "value": "yongsan",
      "label": "용산구"
    },
    {
      "value": "seongdong",
      "label": "성동구"
    },
    {
      "value": "gwangjin",
      "label": "광진구"
    },
    {
      "value": "dongdaemun",
      "label": "동대문구"
    },
    {
      "value": "jungnang",
      "label": "중랑구"
    },
    {
      "value": "seongbuk",
      "label": "성북구"
    },
    {
      "value": "gangbuk",
      "label": "강북구"
    },
    {
      "value": "dobong",
      "label": "도봉구"
    },
    {
      "value": "nowon",
      "label": "노원구"
    },
    {
      "value": "eunpyeong",
      "label": "은평구"
    },
    {
      "value": "seodaemun",
      "label": "서대문구"
    },
    {
      "value": "mapo",
      "label": "마포구"
    },
    {
      "value": "yangcheon",
      "label": "양천구"
    },
    {
      "value": "gangseo",
      "label": "강서구"
    },
    {
      "value": "guro",
      "label": "구로구"
    },
    {
      "value": "geumcheon",
      "label": "금천구"
    },
    {
      "value": "yeongdeungpo",
      "label": "영등포구"
    },
    {
      "value": "dongjak",
      "label": "동작구"
    },
    {
      "value": "gwanak",
      "label": "관악구"
    },
    {
      "value": "seocho",
      "label": "서초구"
    },
    {
      "value": "gangnam",
      "label": "강남구"
    },
    {
      "value": "songpa",
      "label": "송파구"
    },
    {
      "value": "gangdong",
      "label": "강동구"
    }
  ],
  "busan": [
    {
      "value": "junggu_busan",
      "label": "중구"
    },
    {
      "value": "seogu",
      "label": "서구"
    },
    {
      "value": "donggu_busan",
      "label": "동구"
    },
    {
      "value": "yeongdo",
      "label": "영도구"
    },
    {
      "value": "busanjin",
      "label": "부산진구"
    },
    {
      "value": "dongnae",
      "label": "동래구"
    },
    {
      "value": "namgu_busan",
      "label": "남구"
    },
    {
      "value": "bukgu_busan",
      "label": "북구"
    },
    {
      "value": "haeundae",
      "label": "해운대구"
    },
    {
      "value": "saha",
      "label": "사하구"
    },
    {
      "value": "geumjeong",
      "label": "금정구"
    },
    {
      "value": "gangseo_busan",
      "label": "강서구"
    },
    {
      "value": "yeonje",
      "label": "연제구"
    },
    {
      "value": "suyeong",
      "label": "수영구"
    },
    {
      "value": "sasang",
      "label": "사상구"
    },
    {
      "value": "gijang",
      "label": "기장군"
    }
  ],
  "daegu": [
    {
      "value": "junggu_daegu",
      "label": "중구"
    },
    {
      "value": "donggu_daegu",
      "label": "동구"
    },
    {
      "value": "seogu_daegu",
      "label": "서구"
    },
    {
      "value": "namgu_daegu",
      "label": "남구"
    },
    {
      "value": "bukgu_daegu",
      "label": "북구"
    },
    {
      "value": "suseong",
      "label": "수성구"
    },
    {
      "value": "dalseo",
      "label": "달서구"
    },
    {
      "value": "dalseong",
      "label": "달성군"
    }
  ],
  "incheon": [
    {
      "value": "junggu_incheon",
      "label": "중구"
    },
    {
      "value": "donggu",
      "label": "동구"
    },
    {
      "value": "michuhol",
      "label": "미추홀구"
    },
    {
      "value": "yeonsu",
      "label": "연수구"
    },
    {
      "value": "namdong",
      "label": "남동구"
    },
    {
      "value": "bupyeong",
      "label": "부평구"
    },
    {
      "value": "gyeyang",
      "label": "계양구"
    },
    {
      "value": "seo_incheon",
      "label": "서구"
    },
    {
      "value": "ganghwa",
      "label": "강화군"
    },
    {
      "value": "ongjin",
      "label": "옹진군"
    }
  ],
  "gwangju": [
    {
      "value": "donggu_gwangju",
      "label": "동구"
    },
    {
      "value": "seogu_gwangju",
      "label": "서구"
    },
    {
      "value": "namgu_gwangju",
      "label": "남구"
    },
    {
      "value": "bukgu_gwangju",
      "label": "북구"
    },
    {
      "value": "gwangsan",
      "label": "광산구"
    }
  ],
  "daejeon": [
    {
      "value": "donggu_daejeon",
      "label": "동구"
    },
    {
      "value": "junggu_daejeon",
      "label": "중구"
    },
    {
      "value": "seogu_daejeon",
      "label": "서구"
    },
    {
      "value": "yuseong",
      "label": "유성구"
    },
    {
      "value": "daedeok",
      "label": "대덕구"
    }
  ],
  "ulsan": [
    {
      "value": "junggu_ulsan",
      "label": "중구"
    },
    {
      "value": "namgu_ulsan",
      "label": "남구"
    },
    {
      "value": "donggu_ulsan",
      "label": "동구"
    },
    {
      "value": "bukgu_ulsan",
      "label": "북구"
    },
    {
      "value": "ulju",
      "label": "울주군"
    }
  ],
  "sejong": [
    {
      "value": "sejong",
      "label": "세종특별자치시"
    }
  ],
  "gyeonggi": [
    {
      "value": "suwon",
      "label": "수원시"
    },
    {
      "value": "seongnam",
      "label": "성남시"
    },
    {
      "value": "bucheon",
      "label": "부천시"
    },
    {
      "value": "anyang",
      "label": "안양시"
    },
    {
      "value": "ansan",
      "label": "안산시"
    },
    {
      "value": "pyeongtaek",
      "label": "평택시"
    },
    {
      "value": "siheung",
      "label": "시흥시"
    },
    {
      "value": "gwangmyeong",
      "label": "광명시"
    },
    {
      "value": "gwangju_gyeonggi",
      "label": "광주시"
    },
    {
      "value": "yongin",
      "label": "용인시"
    },
    {
      "value": "paju",
      "label": "파주시"
    },
    {
      "value": "icheon",
      "label": "이천시"
    },
    {
      "value": "anseong",
      "label": "안성시"
    },
    {
      "value": "gimpo",
      "label": "김포시"
    },
    {
      "value": "hwaseong",
      "label": "화성시"
    },
    {
      "value": "yeoju",
      "label": "여주시"
    },
    {
      "value": "pocheon",
      "label": "포천시"
    },
    {
      "value": "dongducheon",
      "label": "동두천시"
    },
    {
      "value": "goyang",
      "label": "고양시"
    },
    {
      "value": "namyangju",
      "label": "남양주시"
    },
    {
      "value": "osan",
      "label": "오산시"
    },
    {
      "value": "hanam",
      "label": "하남시"
    },
    {
      "value": "uijeongbu",
      "label": "의정부시"
    },
    {
      "value": "yangju",
      "label": "양주시"
    },
    {
      "value": "gunpo",
      "label": "군포시"
    },
    {
      "value": "uiwang",
      "label": "의왕시"
    },
    {
      "value": "gwachon",
      "label": "과천시"
    },
    {
      "value": "guri",
      "label": "구리시"
    },
    {
      "value": "yeoncheon",
      "label": "연천군"
    },
    {
      "value": "gapyeong",
      "label": "가평군"
    },
    {
      "value": "yangpyeong",
      "label": "양평군"
    }
  ],
  "gangwon": [
    {
      "value": "chuncheon",
      "label": "춘천시"
    },
    {
      "value": "wonju",
      "label": "원주시"
    },
    {
      "value": "gangneung",
      "label": "강릉시"
    },
    {
      "value": "donghae",
      "label": "동해시"
    },
    {
      "value": "taebaek",
      "label": "태백시"
    },
    {
      "value": "sokcho",
      "label": "속초시"
    },
    {
      "value": "samcheok",
      "label": "삼척시"
    },
    {
      "value": "hongcheon",
      "label": "홍천군"
    },
    {
      "value": "cheorwon",
      "label": "철원군"
    },
    {
      "value": "hwachon",
      "label": "화천군"
    },
    {
      "value": "yanggu",
      "label": "양구군"
    },
    {
      "value": "inje",
      "label": "인제군"
    },
    {
      "value": "goseong_gangwon",
      "label": "고성군"
    },
    {
      "value": "yangyang",
      "label": "양양군"
    },
    {
      "value": "pyeongchang",
      "label": "평창군"
    },
    {
      "value": "jeongseon",
      "label": "정선군"
    },
    {
      "value": "yeongwol",
      "label": "영월군"
    }
  ],
  "chungbuk": [
    {
      "value": "cheongju",
      "label": "청주시"
    },
    {
      "value": "chungju",
      "label": "충주시"
    },
    {
      "value": "jecheon",
      "label": "제천시"
    },
    {
      "value": "boeun",
      "label": "보은군"
    },
    {
      "value": "okcheon",
      "label": "옥천군"
    },
    {
      "value": "yeongdong",
      "label": "영동군"
    },
    {
      "value": "jincheon",
      "label": "진천군"
    },
    {
      "value": "goesan",
      "label": "괴산군"
    },
    {
      "value": "eumseong",
      "label": "음성군"
    },
    {
      "value": "danyang",
      "label": "단양군"
    },
    {
      "value": "jeungpyeong",
      "label": "증평군"
    }
  ],
  "chungnam": [
    {
      "value": "cheonan",
      "label": "천안시"
    },
    {
      "value": "gongju",
      "label": "공주시"
    },
    {
      "value": "boryeong",
      "label": "보령시"
    },
    {
      "value": "asan",
      "label": "아산시"
    },
    {
      "value": "seosan",
      "label": "서산시"
    },
    {
      "value": "nonsan",
      "label": "논산시"
    },
    {
      "value": "gyeryong",
      "label": "계룡시"
    },
    {
      "value": "dangjin",
      "label": "당진시"
    },
    {
      "value": "geumsan",
      "label": "금산군"
    },
    {
      "value": "buyeo",
      "label": "부여군"
    },
    {
      "value": "seocheon",
      "label": "서천군"
    },
    {
      "value": "cheongyang",
      "label": "청양군"
    },
    {
      "value": "hongseong",
      "label": "홍성군"
    },
    {
      "value": "yesan",
      "label": "예산군"
    },
    {
      "value": "taean",
      "label": "태안군"
    }
  ],
  "jeonbuk": [
    {
      "value": "jeonju",
      "label": "전주시"
    },
    {
      "value": "gunsan",
      "label": "군산시"
    },
    {
      "value": "iksan",
      "label": "익산시"
    },
    {
      "value": "jeongeup",
      "label": "정읍시"
    },
    {
      "value": "namwon",
      "label": "남원시"
    },
    {
      "value": "gimje",
      "label": "김제시"
    },
    {
      "value": "wanju",
      "label": "완주군"
    },
    {
      "value": "jangsu",
      "label": "장수군"
    },
    {
      "value": "imsil",
      "label": "임실군"
    },
    {
      "value": "sunchang",
      "label": "순창군"
    },
    {
      "value": "jinan",
      "label": "진안군"
    },
    {
      "value": "muju",
      "label": "무주군"
    },
    {
      "value": "buan",
      "label": "부안군"
    },
    {
      "value": "gochang",
      "label": "고창군"
    }
  ],
  "jeonnam": [
    {
      "value": "mokpo",
      "label": "목포시"
    },
    {
      "value": "yeosu",
      "label": "여수시"
    },
    {
      "value": "suncheon",
      "label": "순천시"
    },
    {
      "value": "naju",
      "label": "나주시"
    },
    {
      "value": "gwangyang",
      "label": "광양시"
    },
    {
      "value": "damyang",
      "label": "담양군"
    },
    {
      "value": "gokseong",
      "label": "곡성군"
    },
    {
      "value": "gurye",
      "label": "구례군"
    },
    {
      "value": "goheung",
      "label": "고흥군"
    },
    {
      "value": "boseong",
      "label": "보성군"
    },
    {
      "value": "hwaseong_jeonnam",
      "label": "화순군"
    },
    {
      "value": "jangheung",
      "label": "장흥군"
    },
    {
      "value": "gangjin",
      "label": "강진군"
    },
    {
      "value": "haenam",
      "label": "해남군"
    },
    {
      "value": "yeongam",
      "label": "영암군"
    },
    {
      "value": "muan",
      "label": "무안군"
    },
    {
      "value": "wando",
      "label": "완도군"
    },
    {
      "value": "jindo",
      "label": "진도군"
    },
    {
      "value": "shinan",
      "label": "신안군"
    }
  ],
  "gyeongbuk": [
    {
      "value": "pohang",
      "label": "포항시"
    },
    {
      "value": "gumi",
      "label": "구미시"
    },
    {
      "value": "gimcheon",
      "label": "김천시"
    },
    {
      "value": "andong",
      "label": "안동시"
    },
    {
      "value": "gyeongju",
      "label": "경주시"
    },
    {
      "value": "gyeongsan",
      "label": "경산시"
    },
    {
      "value": "yeongju",
      "label": "영주시"
    },
    {
      "value": "yeongcheon",
      "label": "영천시"
    },
    {
      "value": "sangju",
      "label": "상주시"
    },
    {
      "value": "mungyeong",
      "label": "문경시"
    },
    {
      "value": "chilgok",
      "label": "칠곡군"
    },
    {
      "value": "yecheon",
      "label": "예천군"
    },
    {
      "value": "bonghwa",
      "label": "봉화군"
    },
    {
      "value": "uljin",
      "label": "울진군"
    },
    {
      "value": "ulleung",
      "label": "울릉군"
    },
    {
      "value": "uiseong",
      "label": "의성군"
    },
    {
      "value": "cheongsong",
      "label": "청송군"
    },
    {
      "value": "youngdeok",
      "label": "영덕군"
    },
    {
      "value": "seongju",
      "label": "성주군"
    },
    {
      "value": "goryeong",
      "label": "고령군"
    },
    {
      "value": "gunwi",
      "label": "군위군"
    }
  ],
  "gyeongnam": [
    {
      "value": "changwon",
      "label": "창원시"
    },
    {
      "value": "jinju",
      "label": "진주시"
    },
    {
      "value": "tongyeong",
      "label": "통영시"
    },
    {
      "value": "sacheon",
      "label": "사천시"
    },
    {
      "value": "gimhae",
      "label": "김해시"
    },
    {
      "value": "miryang",
      "label": "밀양시"
    },
    {
      "value": "geoje",
      "label": "거제시"
    },
    {
      "value": "yangsan",
      "label": "양산시"
    },
    {
      "value": "namhae",
      "label": "남해군"
    },
    {
      "value": "hadong",
      "label": "하동군"
    },
    {
      "value": "sancheong",
      "label": "산청군"
    },
    {
      "value": "hamyang",
      "label": "함양군"
    },
    {
      "value": "geochang",
      "label": "거창군"
    },
    {
      "value": "hapcheon",
      "label": "합천군"
    }
  ],
  "jeju": [
    {
      "value": "jeju",
      "label": "제주시"
    },
    {
      "value": "seogwipo",
      "label": "서귀포시"
    }
  ]
};

// 시군구별 읍면동 데이터 (서울, 경기, 인천만 상세 데이터)
export const dongs: { [key: string]: AddressOption[] } = {
  "jongno": [
    {
      "value": "cheongun",
      "label": "청운동"
    },
    {
      "value": "singyo",
      "label": "신교동"
    },
    {
      "value": "gungjeong",
      "label": "궁정동"
    },
    {
      "value": "hyoja",
      "label": "효자동"
    },
    {
      "value": "changseong",
      "label": "창성동"
    },
    {
      "value": "tongui",
      "label": "통의동"
    },
    {
      "value": "jeokseon",
      "label": "적선동"
    },
    {
      "value": "tongin",
      "label": "통인동"
    },
    {
      "value": "nusang",
      "label": "누상동"
    },
    {
      "value": "nuha",
      "label": "누하동"
    },
    {
      "value": "okin",
      "label": "옥인동"
    },
    {
      "value": "chebu",
      "label": "체부동"
    },
    {
      "value": "pilun",
      "label": "필운동"
    },
    {
      "value": "naeja",
      "label": "내자동"
    },
    {
      "value": "sajik",
      "label": "사직동"
    },
    {
      "value": "doryeom",
      "label": "도렴동"
    },
    {
      "value": "dangju",
      "label": "당주동"
    },
    {
      "value": "naesu",
      "label": "내수동"
    },
    {
      "value": "sejongno",
      "label": "세종로"
    },
    {
      "value": "sinmunno",
      "label": "신문로"
    },
    {
      "value": "cheongjin",
      "label": "청진동"
    },
    {
      "value": "seorin",
      "label": "서린동"
    },
    {
      "value": "susong",
      "label": "수송동"
    },
    {
      "value": "junghak",
      "label": "중학동"
    },
    {
      "value": "jongno1",
      "label": "종로1가"
    },
    {
      "value": "gongpyeong",
      "label": "공평동"
    },
    {
      "value": "gwancheol",
      "label": "관철동"
    },
    {
      "value": "gyeonji",
      "label": "견지동"
    },
    {
      "value": "gwonnong",
      "label": "권농동"
    },
    {
      "value": "unni",
      "label": "운니동"
    },
    {
      "value": "ikseon",
      "label": "익선동"
    },
    {
      "value": "gyeongun",
      "label": "경운동"
    },
    {
      "value": "gwanhun",
      "label": "관훈동"
    },
    {
      "value": "insa",
      "label": "인사동"
    },
    {
      "value": "nakwon",
      "label": "낙원동"
    },
    {
      "value": "waryong",
      "label": "와룡동"
    },
    {
      "value": "hunjung",
      "label": "훈정동"
    },
    {
      "value": "myo",
      "label": "묘동"
    },
    {
      "value": "bongik",
      "label": "봉익동"
    },
    {
      "value": "donui",
      "label": "돈의동"
    },
    {
      "value": "jangsa",
      "label": "장사동"
    },
    {
      "value": "gwansu",
      "label": "관수동"
    },
    {
      "value": "jongno2",
      "label": "종로2가"
    },
    {
      "value": "jongno3",
      "label": "종로3가"
    },
    {
      "value": "jongno4",
      "label": "종로4가"
    },
    {
      "value": "hyoje",
      "label": "효제동"
    },
    {
      "value": "jongno5",
      "label": "종로5가"
    },
    {
      "value": "jongno6",
      "label": "종로6가"
    },
    {
      "value": "ihwa",
      "label": "이화동"
    },
    {
      "value": "yeonji",
      "label": "연지동"
    },
    {
      "value": "chungsin",
      "label": "충신동"
    },
    {
      "value": "hyehwa",
      "label": "혜화동"
    },
    {
      "value": "myeongnyun",
      "label": "명륜동"
    }
  ],
  "junggu": [
    {
      "value": "mugyo",
      "label": "무교동"
    },
    {
      "value": "dadong",
      "label": "다동"
    },
    {
      "value": "taepyeongno",
      "label": "태평로"
    },
    {
      "value": "namdaemunno",
      "label": "남대문로"
    },
    {
      "value": "bongnae",
      "label": "봉래동"
    },
    {
      "value": "euljiro",
      "label": "을지로"
    },
    {
      "value": "jeongdong",
      "label": "정동"
    },
    {
      "value": "sunhwa",
      "label": "순화동"
    },
    {
      "value": "uijuro",
      "label": "의주로"
    },
    {
      "value": "chungjeongro",
      "label": "충정로"
    },
    {
      "value": "jungnim",
      "label": "중림동"
    },
    {
      "value": "yejang",
      "label": "예장동"
    },
    {
      "value": "hoehyun",
      "label": "회현동"
    },
    {
      "value": "chungmuro",
      "label": "충무로"
    },
    {
      "value": "pildong",
      "label": "필동"
    },
    {
      "value": "jangchung",
      "label": "장충동"
    },
    {
      "value": "gwanghui",
      "label": "광희동"
    },
    {
      "value": "sindang",
      "label": "신당동"
    },
    {
      "value": "hwanghak",
      "label": "황학동"
    },
    {
      "value": "dasan",
      "label": "다산동"
    },
    {
      "value": "yaksu",
      "label": "약수동"
    },
    {
      "value": "cheonggu",
      "label": "청구동"
    }
  ],
  "yongsan": [
    {
      "value": "huam",
      "label": "후암동"
    },
    {
      "value": "namyeong",
      "label": "남영동"
    },
    {
      "value": "dongja",
      "label": "동자동"
    },
    {
      "value": "seogye",
      "label": "서계동"
    },
    {
      "value": "cheongpa",
      "label": "청파동"
    },
    {
      "value": "wonhyoro",
      "label": "원효로"
    },
    {
      "value": "sinchang",
      "label": "신창동"
    },
    {
      "value": "sancheon",
      "label": "산천동"
    },
    {
      "value": "dowon",
      "label": "도원동"
    },
    {
      "value": "hangangro",
      "label": "한강로"
    },
    {
      "value": "yongsan",
      "label": "용산동"
    },
    {
      "value": "galwol",
      "label": "갈월동"
    },
    {
      "value": "yongmun",
      "label": "용문동"
    },
    {
      "value": "munbae",
      "label": "문배동"
    },
    {
      "value": "singye",
      "label": "신계동"
    },
    {
      "value": "ichon",
      "label": "이촌동"
    },
    {
      "value": "itaewon",
      "label": "이태원동"
    },
    {
      "value": "bogwang",
      "label": "보광동"
    },
    {
      "value": "seobinggo",
      "label": "서빙고동"
    },
    {
      "value": "juseong",
      "label": "주성동"
    },
    {
      "value": "dongbinggo",
      "label": "동빙고동"
    },
    {
      "value": "cheongam",
      "label": "청암동"
    }
  ],
  "seongdong": [
    {
      "value": "wangsimni",
      "label": "왕십리동"
    },
    {
      "value": "doseon",
      "label": "도선동"
    },
    {
      "value": "majang",
      "label": "마장동"
    },
    {
      "value": "yongdap",
      "label": "용답동"
    },
    {
      "value": "seongsu1",
      "label": "성수동1가"
    },
    {
      "value": "seongsu2",
      "label": "성수동2가"
    },
    {
      "value": "hwanghak",
      "label": "황학동"
    },
    {
      "value": "euljiro",
      "label": "을지로동"
    },
    {
      "value": "sindang",
      "label": "신당동"
    },
    {
      "value": "sangwangsimni",
      "label": "상왕십리동"
    },
    {
      "value": "haengdang",
      "label": "행당동"
    },
    {
      "value": "seongsu",
      "label": "성수동"
    },
    {
      "value": "sageun",
      "label": "사근동"
    },
    {
      "value": "eungbong",
      "label": "응봉동"
    },
    {
      "value": "geumho",
      "label": "금호동"
    },
    {
      "value": "oksu",
      "label": "옥수동"
    },
    {
      "value": "songjeong",
      "label": "송정동"
    }
  ],
  "gwangjin": [
    {
      "value": "junggok",
      "label": "중곡동"
    },
    {
      "value": "neung",
      "label": "능동"
    },
    {
      "value": "gunja",
      "label": "군자동"
    },
    {
      "value": "hwayang",
      "label": "화양동"
    },
    {
      "value": "jayang",
      "label": "자양동"
    },
    {
      "value": "goui",
      "label": "구의동"
    }
  ],
  "dongdaemun": [
    {
      "value": "yongdu",
      "label": "용두동"
    },
    {
      "value": "jegi",
      "label": "제기동"
    },
    {
      "value": "jeonnong",
      "label": "전농동"
    },
    {
      "value": "dapsimni",
      "label": "답십리동"
    },
    {
      "value": "jangan",
      "label": "장안동"
    },
    {
      "value": "cheongnyangni",
      "label": "청량리동"
    },
    {
      "value": "hoegi",
      "label": "회기동"
    },
    {
      "value": "hwigyeong",
      "label": "휘경동"
    },
    {
      "value": "imun",
      "label": "이문동"
    }
  ],
  "jungnang": [
    {
      "value": "myeonmok",
      "label": "면목동"
    },
    {
      "value": "sangbong",
      "label": "상봉동"
    },
    {
      "value": "junghwa",
      "label": "중화동"
    },
    {
      "value": "muk",
      "label": "묵동"
    },
    {
      "value": "mangu",
      "label": "망우동"
    },
    {
      "value": "sinae",
      "label": "신내동"
    }
  ],
  "seongbuk": [
    {
      "value": "seongbuk",
      "label": "성북동"
    },
    {
      "value": "samseon",
      "label": "삼선동"
    },
    {
      "value": "dongseon",
      "label": "동선동"
    },
    {
      "value": "donam",
      "label": "돈암동"
    },
    {
      "value": "anam",
      "label": "안암동"
    },
    {
      "value": "bomun",
      "label": "보문동"
    },
    {
      "value": "jeongneung",
      "label": "정릉동"
    },
    {
      "value": "gireum",
      "label": "길음동"
    },
    {
      "value": "jongam",
      "label": "종암동"
    },
    {
      "value": "wolgok",
      "label": "월곡동"
    },
    {
      "value": "jangwi",
      "label": "장위동"
    },
    {
      "value": "seokgwan",
      "label": "석관동"
    }
  ],
  "gangbuk": [
    {
      "value": "mia",
      "label": "미아동"
    },
    {
      "value": "beon",
      "label": "번동"
    },
    {
      "value": "suyu",
      "label": "수유동"
    },
    {
      "value": "ui",
      "label": "우이동"
    }
  ],
  "dobong": [
    {
      "value": "ssangmun",
      "label": "쌍문동"
    },
    {
      "value": "banghak",
      "label": "방학동"
    },
    {
      "value": "chang",
      "label": "창동"
    },
    {
      "value": "dobong",
      "label": "도봉동"
    }
  ],
  "nowon": [
    {
      "value": "wolgye",
      "label": "월계동"
    },
    {
      "value": "gongneung",
      "label": "공릉동"
    },
    {
      "value": "hagye",
      "label": "하계동"
    },
    {
      "value": "junggye",
      "label": "중계동"
    },
    {
      "value": "sanggye",
      "label": "상계동"
    }
  ],
  "eunpyeong": [
    {
      "value": "nokbeon",
      "label": "녹번동"
    },
    {
      "value": "bulgwang",
      "label": "불광동"
    },
    {
      "value": "galhyeon",
      "label": "갈현동"
    },
    {
      "value": "gusan",
      "label": "구산동"
    },
    {
      "value": "daejo",
      "label": "대조동"
    },
    {
      "value": "eungam",
      "label": "응암동"
    },
    {
      "value": "yeokchon",
      "label": "역촌동"
    },
    {
      "value": "sinsa",
      "label": "신사동"
    },
    {
      "value": "jeungsan",
      "label": "증산동"
    },
    {
      "value": "susaek",
      "label": "수색동"
    },
    {
      "value": "jingwan",
      "label": "진관동"
    }
  ],
  "seodaemun": [
    {
      "value": "chungjeongro",
      "label": "충정로"
    },
    {
      "value": "naengcheon",
      "label": "냉천동"
    },
    {
      "value": "cheonyeon",
      "label": "천연동"
    },
    {
      "value": "bukahyeon",
      "label": "북아현동"
    },
    {
      "value": "chunghyeon",
      "label": "충현동"
    },
    {
      "value": "hap",
      "label": "합동"
    },
    {
      "value": "hyeonjeo",
      "label": "현저동"
    },
    {
      "value": "daehyeon",
      "label": "대현동"
    },
    {
      "value": "daesin",
      "label": "대신동"
    },
    {
      "value": "sinchon",
      "label": "신촌동"
    },
    {
      "value": "yeonhui",
      "label": "연희동"
    },
    {
      "value": "hongeun",
      "label": "홍은동"
    },
    {
      "value": "namgajwa",
      "label": "남가좌동"
    },
    {
      "value": "bukgajwa",
      "label": "북가좌동"
    }
  ],
  "mapo": [
    {
      "value": "ahyeon",
      "label": "아현동"
    },
    {
      "value": "gongdeok",
      "label": "공덕동"
    },
    {
      "value": "dohwa",
      "label": "도화동"
    },
    {
      "value": "yonggang",
      "label": "용강동"
    },
    {
      "value": "daeheung",
      "label": "대흥동"
    },
    {
      "value": "yeomni",
      "label": "염리동"
    },
    {
      "value": "sinsu",
      "label": "신수동"
    },
    {
      "value": "seogang",
      "label": "서강동"
    },
    {
      "value": "seogyo",
      "label": "서교동"
    },
    {
      "value": "hapjeong",
      "label": "합정동"
    },
    {
      "value": "mangwon",
      "label": "망원동"
    },
    {
      "value": "yeonnam",
      "label": "연남동"
    },
    {
      "value": "seongsan",
      "label": "성산동"
    },
    {
      "value": "sangam",
      "label": "상암동"
    }
  ],
  "yangcheon": [
    {
      "value": "mok",
      "label": "목동"
    },
    {
      "value": "sinjeong",
      "label": "신정동"
    },
    {
      "value": "sinwol",
      "label": "신월동"
    }
  ],
  "gangseo": [
    {
      "value": "yeomchang",
      "label": "염창동"
    },
    {
      "value": "deungchon",
      "label": "등촌동"
    },
    {
      "value": "hwagok",
      "label": "화곡동"
    },
    {
      "value": "gayang",
      "label": "가양동"
    },
    {
      "value": "balsan",
      "label": "발산동"
    },
    {
      "value": "banghwa",
      "label": "방화동"
    },
    {
      "value": "gonghang",
      "label": "공항동"
    },
    {
      "value": "magok",
      "label": "마곡동"
    },
    {
      "value": "gaehwa",
      "label": "개화동"
    },
    {
      "value": "gwaha",
      "label": "과해동"
    },
    {
      "value": "ogok",
      "label": "오곡동"
    },
    {
      "value": "osoe",
      "label": "오쇠동"
    }
  ],
  "guro": [
    {
      "value": "sindorim",
      "label": "신도림동"
    },
    {
      "value": "guro",
      "label": "구로동"
    },
    {
      "value": "garibong",
      "label": "가리봉동"
    },
    {
      "value": "gocheok",
      "label": "고척동"
    },
    {
      "value": "gaebong",
      "label": "개봉동"
    },
    {
      "value": "oryu",
      "label": "오류동"
    },
    {
      "value": "gung",
      "label": "궁동"
    },
    {
      "value": "onsu",
      "label": "온수동"
    },
    {
      "value": "cheonwang",
      "label": "천왕동"
    },
    {
      "value": "hang",
      "label": "항동"
    }
  ],
  "geumcheon": [
    {
      "value": "gasan",
      "label": "가산동"
    },
    {
      "value": "doksan",
      "label": "독산동"
    },
    {
      "value": "siheung",
      "label": "시흥동"
    }
  ],
  "yeongdeungpo": [
    {
      "value": "yeongdeungpo",
      "label": "영등포동"
    },
    {
      "value": "dangsan",
      "label": "당산동"
    },
    {
      "value": "yeouido",
      "label": "여의도동"
    },
    {
      "value": "yangpyeong",
      "label": "양평동"
    },
    {
      "value": "munrae",
      "label": "문래동"
    },
    {
      "value": "dorim",
      "label": "도림동"
    },
    {
      "value": "singil",
      "label": "신길동"
    },
    {
      "value": "daerim",
      "label": "대림동"
    },
    {
      "value": "yanghwa",
      "label": "양화동"
    }
  ],
  "dongjak": [
    {
      "value": "noryangjin",
      "label": "노량진동"
    },
    {
      "value": "sangdo",
      "label": "상도동"
    },
    {
      "value": "daebang",
      "label": "대방동"
    },
    {
      "value": "bon",
      "label": "본동"
    },
    {
      "value": "heukseok",
      "label": "흑석동"
    },
    {
      "value": "sadang",
      "label": "사당동"
    },
    {
      "value": "sindaebang",
      "label": "신대방동"
    }
  ],
  "gwanak": [
    {
      "value": "bongcheon",
      "label": "봉천동"
    },
    {
      "value": "sinrim",
      "label": "신림동"
    },
    {
      "value": "namhyeon",
      "label": "남현동"
    }
  ],
  "seocho": [
    {
      "value": "banpo",
      "label": "반포동"
    },
    {
      "value": "bangbae",
      "label": "방배동"
    },
    {
      "value": "seocho",
      "label": "서초동"
    },
    {
      "value": "yangjae",
      "label": "양재동"
    },
    {
      "value": "jamwon",
      "label": "잠원동"
    },
    {
      "value": "naego",
      "label": "내곡동"
    },
    {
      "value": "umyeon",
      "label": "우면동"
    },
    {
      "value": "yeomgok",
      "label": "염곡동"
    },
    {
      "value": "wonji",
      "label": "원지동"
    },
    {
      "value": "sinwon",
      "label": "신원동"
    }
  ],
  "gangnam": [
    {
      "value": "apgujeong",
      "label": "압구정동"
    },
    {
      "value": "cheongdam",
      "label": "청담동"
    },
    {
      "value": "daechi",
      "label": "대치동"
    },
    {
      "value": "dogok",
      "label": "도곡동"
    },
    {
      "value": "gaepo",
      "label": "개포동"
    },
    {
      "value": "irwon",
      "label": "일원동"
    },
    {
      "value": "nonhyeon",
      "label": "논현동"
    },
    {
      "value": "samseong",
      "label": "삼성동"
    },
    {
      "value": "sinsa",
      "label": "신사동"
    },
    {
      "value": "suseo",
      "label": "수서동"
    },
    {
      "value": "sego",
      "label": "세곡동"
    },
    {
      "value": "yeoksam",
      "label": "역삼동"
    },
    {
      "value": "jagok",
      "label": "자곡동"
    },
    {
      "value": "yulhyeon",
      "label": "율현동"
    }
  ],
  "songpa": [
    {
      "value": "jamsil",
      "label": "잠실동"
    },
    {
      "value": "sincheon",
      "label": "신천동"
    },
    {
      "value": "pungnap",
      "label": "풍납동"
    },
    {
      "value": "songpa",
      "label": "송파동"
    },
    {
      "value": "sokchon",
      "label": "석촌동"
    },
    {
      "value": "samjeon",
      "label": "삼전동"
    },
    {
      "value": "garak",
      "label": "가락동"
    },
    {
      "value": "munjeong",
      "label": "문정동"
    },
    {
      "value": "jangji",
      "label": "장지동"
    },
    {
      "value": "bangi",
      "label": "방이동"
    },
    {
      "value": "ogeum",
      "label": "오금동"
    },
    {
      "value": "geoyeo",
      "label": "거여동"
    },
    {
      "value": "macheon",
      "label": "마천동"
    }
  ],
  "gangdong": [
    {
      "value": "myeongil",
      "label": "명일동"
    },
    {
      "value": "godeok",
      "label": "고덕동"
    },
    {
      "value": "sangil",
      "label": "상일동"
    },
    {
      "value": "gil",
      "label": "길동"
    },
    {
      "value": "dunchon",
      "label": "둔촌동"
    },
    {
      "value": "amsa",
      "label": "암사동"
    },
    {
      "value": "cheonho",
      "label": "천호동"
    },
    {
      "value": "seongnae",
      "label": "성내동"
    }
  ],
  "suwon": [
    {
      "value": "gwonseon",
      "label": "권선구"
    },
    {
      "value": "yeongtong",
      "label": "영통구"
    },
    {
      "value": "jangan",
      "label": "장안구"
    },
    {
      "value": "paldal",
      "label": "팔달구"
    }
  ],
  "seongnam": [
    {
      "value": "bundang",
      "label": "분당구"
    },
    {
      "value": "jungwon",
      "label": "중원구"
    },
    {
      "value": "sujeong",
      "label": "수정구"
    }
  ],
  "goyang": [
    {
      "value": "deogyang",
      "label": "덕양구"
    },
    {
      "value": "ilsan",
      "label": "일산동구"
    },
    {
      "value": "ilsan2",
      "label": "일산서구"
    }
  ],
  "yongin": [
    {
      "value": "cheoin",
      "label": "처인구"
    },
    {
      "value": "giheung",
      "label": "기흥구"
    },
    {
      "value": "suji",
      "label": "수지구"
    }
  ],
  "ansan": [
    {
      "value": "sangrok",
      "label": "상록구"
    },
    {
      "value": "danwon",
      "label": "단원구"
    }
  ],
  "anyang": [
    {
      "value": "manan",
      "label": "만안구"
    },
    {
      "value": "dongan",
      "label": "동안구"
    }
  ],
  "bucheon": [
    {
      "value": "sosa",
      "label": "소사구"
    },
    {
      "value": "ojeong",
      "label": "오정구"
    },
    {
      "value": "wonmi",
      "label": "원미구"
    }
  ],
  "pyeongtaek": [
    {
      "value": "pyeongtaek",
      "label": "평택동"
    },
    {
      "value": "songtan",
      "label": "송탄동"
    },
    {
      "value": "jinwi",
      "label": "진위동"
    },
    {
      "value": "seojeong",
      "label": "서정동"
    },
    {
      "value": "gunpo",
      "label": "군포동"
    },
    {
      "value": "godeok",
      "label": "고덕동"
    },
    {
      "value": "paju",
      "label": "파주동"
    },
    {
      "value": "anjeong",
      "label": "안중동"
    },
    {
      "value": "poseung",
      "label": "포승동"
    },
    {
      "value": "paengseong",
      "label": "팽성동"
    }
  ],
  "siheung": [
    {
      "value": "siheung",
      "label": "시흥동"
    },
    {
      "value": "jeongwang",
      "label": "정왕동"
    },
    {
      "value": "daeya",
      "label": "대야동"
    },
    {
      "value": "gunpo",
      "label": "군포동"
    },
    {
      "value": "godeok",
      "label": "고덕동"
    },
    {
      "value": "paju",
      "label": "파주동"
    },
    {
      "value": "anjeong",
      "label": "안중동"
    },
    {
      "value": "poseung",
      "label": "포승동"
    },
    {
      "value": "paengseong",
      "label": "팽성동"
    }
  ],
  "gimpo": [
    {
      "value": "gimpo",
      "label": "김포동"
    },
    {
      "value": "tongjin",
      "label": "통진동"
    },
    {
      "value": "yangchon",
      "label": "양촌동"
    },
    {
      "value": "daegot",
      "label": "대곶동"
    },
    {
      "value": "wolgot",
      "label": "월곶동"
    },
    {
      "value": "haegot",
      "label": "해곶동"
    },
    {
      "value": "masan",
      "label": "마산동"
    },
    {
      "value": "jangneung",
      "label": "장기동"
    },
    {
      "value": "gurae",
      "label": "구래동"
    },
    {
      "value": "ungok",
      "label": "운양동"
    },
    {
      "value": "hwado",
      "label": "화도동"
    }
  ],
  "junggu_incheon": [
    {
      "value": "junggu_incheon",
      "label": "중구"
    },
    {
      "value": "donggu_incheon",
      "label": "동구"
    },
    {
      "value": "michuhol",
      "label": "미추홀구"
    },
    {
      "value": "yeonsu",
      "label": "연수구"
    },
    {
      "value": "namdong",
      "label": "남동구"
    },
    {
      "value": "bupyeong",
      "label": "부평구"
    },
    {
      "value": "gyeyang",
      "label": "계양구"
    },
    {
      "value": "seo_incheon",
      "label": "서구"
    }
  ]
};

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
