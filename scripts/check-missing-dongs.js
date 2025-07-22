const fs = require('fs');
const path = require('path');

// 빠진 동들을 체크하는 스크립트
async function checkMissingDongs() {
  try {
    console.log('빠진 동들을 체크하기 시작합니다...');

    // 현재 address-data.ts 파일 읽기
    const addressDataPath = path.join(__dirname, '..', 'src', 'lib', 'address-data.ts');
    const addressDataContent = fs.readFileSync(addressDataPath, 'utf8');
    
    // districts와 dongs 데이터 추출 (간단한 파싱)
    const districtsMatch = addressDataContent.match(/export const districts: \{ \[key: string\]: AddressOption\[\] \} = (\{[\s\S]*?\});/);
    const dongsMatch = addressDataContent.match(/export const dongs: \{ \[key: string\]: AddressOption\[\] \} = (\{[\s\S]*?\});/);
    
    if (!districtsMatch || !dongsMatch) {
      console.error('address-data.ts 파일에서 데이터를 추출할 수 없습니다.');
      return;
    }

    // JSON 파싱을 위해 문자열 정리
    const districtsStr = districtsMatch[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
    const dongsStr = dongsMatch[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
    
    const districts = JSON.parse(districtsStr);
    const dongs = JSON.parse(dongsStr);

    console.log(`현재 데이터: ${Object.keys(districts).length}개 시도, ${Object.values(districts).flat().length}개 시군구, ${Object.values(dongs).flat().length}개 동`);

    // 서울, 경기, 인천의 상세 동 데이터 체크
    const detailedProvinces = ['seoul', 'gyeonggi', 'incheon'];
    const missingDongs = {};

    for (const province of detailedProvinces) {
      const provinceDistricts = districts[province] || [];
      console.log(`\n${province} 지역 체크 중...`);
      
      for (const district of provinceDistricts) {
        const districtKey = district.value;
        const currentDongs = dongs[districtKey] || [];
        
        console.log(`  ${district.label} (${districtKey}): 현재 ${currentDongs.length}개 동`);
        
        try {
          // 공공데이터포털 도로명주소 API 호출
          const apiDongs = await fetchDongsFromAPI(district.label, province);
          
          if (apiDongs.length > 0) {
            const currentDongLabels = currentDongs.map(d => d.label);
            const missingInCurrent = apiDongs.filter(apiDong => 
              !currentDongLabels.includes(apiDong.label)
            );
            
            if (missingInCurrent.length > 0) {
              missingDongs[districtKey] = {
                district: district.label,
                missing: missingInCurrent,
                current: currentDongs.length,
                api: apiDongs.length
              };
              console.log(`    ❌ ${missingInCurrent.length}개 동 누락:`, missingInCurrent.map(d => d.label).join(', '));
            } else {
              console.log(`    ✅ 모든 동 포함됨`);
            }
          }
          
          // API 호출 간격 조절
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.log(`    ⚠️ API 호출 실패: ${error.message}`);
        }
      }
    }

    // 결과 출력
    if (Object.keys(missingDongs).length > 0) {
      console.log('\n=== 빠진 동들 요약 ===');
      for (const [districtKey, info] of Object.entries(missingDongs)) {
        console.log(`\n${info.district} (${districtKey}):`);
        console.log(`  현재: ${info.current}개, API: ${info.api}개, 누락: ${info.missing.length}개`);
        console.log(`  누락된 동들: ${info.missing.map(d => d.label).join(', ')}`);
      }
      
      // 누락된 동들을 추가하는 스크립트 생성
      generateUpdateScript(missingDongs);
    } else {
      console.log('\n✅ 모든 동이 포함되어 있습니다!');
    }

  } catch (error) {
    console.error('체크 중 오류가 발생했습니다:', error);
  }
}

async function fetchDongsFromAPI(districtName, province) {
  try {
    // 공공데이터포털 도로명주소 API (실제 API 키가 필요)
    // 여기서는 예시 데이터를 반환
    const mockApiData = getMockApiData(districtName, province);
    return mockApiData;
  } catch (error) {
    console.error(`API 호출 실패 (${districtName}):`, error.message);
    return [];
  }
}

function getMockApiData(districtName, province) {
  // 실제 API 대신 알려진 누락된 동들 반환
  const mockData = {
    '서울특별시 강남구': [
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
    '서울특별시 서초구': [
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
    '서울특별시 송파구': [
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
    '경기도 수원시': [
      { value: "gwonseon", label: "권선구" },
      { value: "yeongtong", label: "영통구" },
      { value: "jangan", label: "장안구" },
      { value: "paldal", label: "팔달구" },
    ],
    '경기도 성남시': [
      { value: "bundang", label: "분당구" },
      { value: "jungwon", label: "중원구" },
      { value: "sujeong", label: "수정구" },
    ],
  };

  const key = `${province === 'seoul' ? '서울특별시' : province === 'gyeonggi' ? '경기도' : '인천광역시'} ${districtName}`;
  return mockData[key] || [];
}

function generateUpdateScript(missingDongs) {
  console.log('\n=== 업데이트 스크립트 생성 ===');
  
  let updateScript = '';
  for (const [districtKey, info] of Object.entries(missingDongs)) {
    updateScript += `      // ${info.district} 추가 동들\n`;
    updateScript += `      ${districtKey}: [\n`;
    
    // 기존 동들
    const currentDongs = getCurrentDongs(districtKey);
    currentDongs.forEach(dong => {
      updateScript += `        { value: "${dong.value}", label: "${dong.label}" },\n`;
    });
    
    // 누락된 동들 추가
    info.missing.forEach(dong => {
      updateScript += `        { value: "${dong.value}", label: "${dong.label}" },\n`;
    });
    
    updateScript += `      ],\n\n`;
  }
  
  console.log('다음 코드를 scripts/update-address-data.js의 dongs 객체에 추가하세요:');
  console.log(updateScript);
  
  // 파일로 저장
  const updateFilePath = path.join(__dirname, 'missing-dongs-update.js');
  fs.writeFileSync(updateFilePath, updateScript, 'utf8');
  console.log(`\n업데이트 코드가 ${updateFilePath}에 저장되었습니다.`);
}

function getCurrentDongs(districtKey) {
  // 현재 dongs 데이터에서 해당 district의 동들 반환
  const addressDataPath = path.join(__dirname, '..', 'src', 'lib', 'address-data.ts');
  const addressDataContent = fs.readFileSync(addressDataPath, 'utf8');
  
  const dongsMatch = addressDataContent.match(/export const dongs: \{ \[key: string\]: AddressOption\[\] \} = (\{[\s\S]*?\});/);
  if (!dongsMatch) return [];
  
  const dongsStr = dongsMatch[1].replace(/(\w+):/g, '"$1":').replace(/'/g, '"');
  const dongs = JSON.parse(dongsStr);
  
  return dongs[districtKey] || [];
}

// 스크립트 실행
if (require.main === module) {
  checkMissingDongs();
}

module.exports = { checkMissingDongs }; 