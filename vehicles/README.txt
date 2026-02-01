Autolab Vehicles Pack v3 (요구사항 반영)

✅ 핵심
- 상세는 '현재 시즌 2대'만 (featured에서 선택한 시즌의 EV/CV 2대)
- 이전 차량은 모달 유지 (previous는 상세 페이지 없음)
- 2027 자동 생성: vehicles.json에 2027 항목만 넣으면 목록/상세가 자동 반영
- 상세 페이지는 1개만 사용: vehicles/detail.html?id=ale-27
  → 시즌이 늘어나도 HTML 추가 생성 필요 없음

Included (place into Autolab/vehicles/):
- vehicles.html
- vehiclesstyle.css
- vehicles.js
- vehicles.json
- detail.html
- vehicledetailstyle.css
- vehicledetail.js

Install:
1) Copy all files into Autolab/vehicles/
2) Paste your main navbar (index.html header) into:
   - vehicles/vehicles.html
   - vehicles/detail.html

3) Images (optional but recommended) in Autolab/vehicles/images/:
   - ale-26-hero.jpg, alc-26-hero.jpg
   - ale-26-1.jpg..3, alc-26-1.jpg..3
   - ale-27-hero.jpg, alc-27-hero.jpg
   - ale-27-1.jpg..3, alc-27-1.jpg..3
   - ale-25.jpg, alc-25.jpg, ale-24.jpg

How to update:
- Add/modify data in vehicles/vehicles.json only.
  * featured: 상세 가능한 차량(현재 시즌 EV/CV 포함)
  * previous: 모달로만 보여줄 과거 차량
