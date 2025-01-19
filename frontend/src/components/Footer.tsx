import React from 'react'

function Footer() {
  return (
    <footer className="bg-gradient-to-r from-[#fb8124] via-[#fb8124] to-[#f5b83c] text-white py-8 mr-10 ml-10 rounded-md shadow-md">
      <div className="container mx-auto px-4">
        <h3 className="text-lg font-bold text-white">
          กองโรคจากการประกอบอาชีพและสิ่งแวดล้อม
        </h3>
        <div className="mx-auto h-[2px] bg-white/30 mt-0"></div>
        <p className="mt-2">
          ตึกกรมควบคุมโรค กระทรวงสาธารณสุข อาคาร 10 ชั้น 2 <br />
          ถนนติวานนท์, ตำบลตลาดขวัญ อำเภอเมือง จังหวัดนนทบุรี, 11000 <br />
          โทรศัพท์: 02 590 3865
        </p>
      </div>
    </footer>

  )
}

export default Footer