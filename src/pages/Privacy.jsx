import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">돌아가기</span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">개인정보처리방침</h1>
          <p className="text-sm text-gray-500 mb-8">최종 수정일: 2025년 1월 13일</p>

          <div className="space-y-8">
            {/* 제1조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제1조 (개인정보의 처리 목적)</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                UDT79(이하 "회사")는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
              </p>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① 회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리</p>
                <p>② 서비스 제공: 게시판 서비스, 커뮤니티 서비스 제공</p>
                <p>③ 고충처리: 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한 연락·통지</p>
              </div>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제2조 (처리하는 개인정보의 항목)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① 회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
                <p className="ml-4">• 필수항목: 이메일 주소, 비밀번호</p>
                <p className="ml-4">• 선택항목: 닉네임, 프로필 사진, 자기소개</p>
                <p>② 서비스 이용 과정에서 다음의 정보가 자동으로 생성되어 수집될 수 있습니다.</p>
                <p className="ml-4">• IP주소, 쿠키, 서비스 이용 기록, 방문 기록</p>
              </div>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제3조 (개인정보의 처리 및 보유기간)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
                <p>② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.</p>
                <p className="ml-4">• 회원 가입 및 관리: 회원 탈퇴 시까지</p>
                <p className="ml-4">• 단, 관계 법령 위반에 따른 수사·조사 등이 진행중인 경우에는 해당 수사·조사 종료 시까지</p>
              </div>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제4조 (개인정보의 제3자 제공)</h2>
              <p className="text-gray-700 leading-relaxed">
                회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보 보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
              </p>
            </section>

            {/* 제5조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제5조 (개인정보의 파기)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.</p>
                <p>② 개인정보 파기의 절차 및 방법은 다음과 같습니다.</p>
                <p className="ml-4">• 파기절차: 불필요한 개인정보 및 개인정보파일을 선정하고, 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.</p>
                <p className="ml-4">• 파기방법: 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기하며, 종이 문서에 기록·저장된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.</p>
              </div>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제6조 (정보주체의 권리·의무 및 행사방법)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.</p>
                <p className="ml-4">1. 개인정보 열람요구</p>
                <p className="ml-4">2. 오류 등이 있을 경우 정정 요구</p>
                <p className="ml-4">3. 삭제요구</p>
                <p className="ml-4">4. 처리정지 요구</p>
                <p>② 제1항에 따른 권리 행사는 서비스 내 설정 메뉴를 통하여 하실 수 있습니다.</p>
              </div>
            </section>

            {/* 제7조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제7조 (개인정보의 안전성 확보조치)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.</p>
                <p className="ml-4">1. 개인정보 취급 직원의 최소화 및 교육</p>
                <p className="ml-4">2. 개인정보에 대한 접근 제한</p>
                <p className="ml-4">3. 접속기록의 보관 및 위변조 방지</p>
                <p className="ml-4">4. 개인정보의 암호화</p>
                <p className="ml-4">5. 보안프로그램 설치 및 주기적 갱신·점검</p>
              </div>
            </section>

            {/* 제8조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제8조 (개인정보 보호책임자)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p>▶ 개인정보 보호책임자</p>
                  <p className="ml-4">• 이메일: support@udt79.com</p>
                </div>
              </div>
            </section>

            {/* 제9조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제9조 (개인정보 처리방침의 변경)</h2>
              <p className="text-gray-700 leading-relaxed">
                이 개인정보 처리방침은 2025년 1월 13일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
              </p>
            </section>

            {/* 부칙 */}
            <section className="pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold mb-3">부칙</h2>
              <p className="text-gray-700">본 방침은 2025년 1월 13일부터 시행됩니다.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}