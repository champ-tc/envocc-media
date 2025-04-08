import React from 'react'

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#fdb7fe] via-[#c78ee8] to-[#9063d2] text-white py-8  shadow-md">
      <div className="container mx-auto px-4">
        <h3 className="text-lg font-bold text-gray-900">
          กองโรคจากการประกอบอาชีพและสิ่งแวดล้อม
        </h3>
        <div className="mx-auto h-[2px] bg-white/30 mt-0"></div>
        <p className="mt-2 text-gray-900">
          ตึกกรมควบคุมโรค กระทรวงสาธารณสุข อาคาร 10 ชั้น 2 <br />
          ถนนติวานนท์, ตำบลตลาดขวัญ อำเภอเมือง จังหวัดนนทบุรี, 11000 <br />
          โทรศัพท์: 02 590 3865
        </p>
      </div>
    </footer>
  )
}

export default Footer