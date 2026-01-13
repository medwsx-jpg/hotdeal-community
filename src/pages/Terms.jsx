import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function Terms() {
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
          <h1 className="text-3xl font-bold mb-2">서비스 이용약관</h1>
          <p className="text-sm text-gray-500 mb-8">최종 수정일: 2025년 1월 13일</p>

          <div className="space-y-8">
            {/* 제1조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제1조 (목적)</h2>
              <p className="text-gray-700 leading-relaxed">
                이 약관은 UDT79(이하 "회사")가 제공하는 우리동네 특공대 친구 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
              </p>
            </section>

            {/* 제2조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제2조 (정의)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① "서비스"란 회사가 제공하는 지역 커뮤니티 플랫폼 및 관련 제반 서비스를 의미합니다.</p>
                <p>② "이용자"란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</p>
                <p>③ "회원"이란 회사와 서비스 이용계약을 체결하고 아이디를 부여받은 자를 말합니다.</p>
                <p>④ "게시물"이란 회원이 서비스를 이용함에 있어 서비스에 게시한 글, 사진, 동영상 및 각종 파일과 링크 등을 의미합니다.</p>
              </div>
            </section>

            {/* 제3조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제3조 (약관의 게시와 개정)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① 회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
                <p>② 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.</p>
                <p>③ 회사가 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 초기화면에 그 적용일자 7일 이전부터 공지합니다.</p>
              </div>
            </section>

            {/* 제4조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제4조 (회원가입)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</p>
                <p>② 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다.</p>
                <p className="ml-4">1. 등록 내용에 허위, 기재누락, 오기가 있는 경우</p>
                <p className="ml-4">2. 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</p>
                <p>③ 회원가입계약의 성립 시기는 회사의 승낙이 회원에게 도달한 시점으로 합니다.</p>
              </div>
            </section>

            {/* 제5조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제5조 (회원정보의 변경)</h2>
              <p className="text-gray-700 leading-relaxed">
                회원은 개인정보관리화면을 통하여 언제든지 본인의 개인정보를 열람하고 수정할 수 있습니다. 다만, 서비스 관리를 위해 필요한 아이디 등은 수정이 불가능합니다.
              </p>
            </section>

            {/* 제6조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제6조 (회원탈퇴 및 자격 상실)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① 회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 회원탈퇴를 처리합니다.</p>
                <p>② 회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다.</p>
                <p className="ml-4">1. 가입 신청 시에 허위 내용을 등록한 경우</p>
                <p className="ml-4">2. 다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</p>
                <p className="ml-4">3. 서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</p>
              </div>
            </section>

            {/* 제7조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제7조 (게시물의 저작권)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① 회원이 서비스 내에 게시한 게시물의 저작권은 해당 게시물의 저작자에게 귀속됩니다.</p>
                <p>② 회원이 서비스 내에 게시하는 게시물은 검색결과 내지 서비스 및 관련 프로모션 등에 노출될 수 있으며, 해당 노출을 위해 필요한 범위 내에서는 일부 수정, 복제, 편집되어 게시될 수 있습니다.</p>
                <p>③ 회사는 제2항 이외의 방법으로 회원의 게시물을 이용하고자 하는 경우에는 전화, 팩스, 전자우편 등을 통해 사전에 회원의 동의를 얻어야 합니다.</p>
              </div>
            </section>

            {/* 제8조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제8조 (게시물의 관리)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① 회원의 게시물이 관련 법령에 위반되는 내용을 포함하는 경우, 권리자는 관련 법령이 정한 절차에 따라 해당 게시물의 게시중단 및 삭제 등을 요청할 수 있으며, 회사는 관련 법령에 따라 조치를 취하여야 합니다.</p>
                <p>② 회사는 전항에 따른 권리자의 요청이 없는 경우라도 권리침해가 인정될 만한 사유가 있거나 기타 회사 정책 및 관련 법령에 위반되는 경우에는 관련 법령에 따라 해당 게시물에 대해 임시조치 등을 취할 수 있습니다.</p>
              </div>
            </section>

            {/* 제9조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제9조 (면책조항)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
                <p>② 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.</p>
                <p>③ 회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며 그 밖에 서비스를 통하여 얻은 자료로 인한 손해 등에 대하여도 책임을 지지 않습니다.</p>
                <p>④ 회사는 회원이 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.</p>
              </div>
            </section>

            {/* 제10조 */}
            <section>
              <h2 className="text-xl font-bold mb-3">제10조 (준거법 및 재판관할)</h2>
              <div className="space-y-2 text-gray-700 leading-relaxed">
                <p>① 회사와 이용자 간에 제기된 소송에는 대한민국 법을 준거법으로 합니다.</p>
                <p>② 회사와 이용자 간에 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제소합니다.</p>
              </div>
            </section>

            {/* 부칙 */}
            <section className="pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold mb-3">부칙</h2>
              <p className="text-gray-700">본 약관은 2025년 1월 13일부터 시행됩니다.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}