import { useEffect, useState } from "react";
import SidebarLayout from "../../layouts/SidebarLayout";
import dot from "../../assets/icons/write/Circle.svg";
import { useAuth } from "../../hooks/useAuth";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import KakaoMap from "../../components/commons/KakaoMap";
import SubmitModal from "../../components/modal/SubmitModal";
import { getNewWorksDetail } from "../../api/newWorksApi";
import { getImageByFileName } from "../../api/researchApi";

const ResearchReportPage = () => {
  const { isLoggedIn, role } = useAuth();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false); // 이미지 모달 상태
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false); // 승인 모달 상태
  const [myCoords, setMyCoords] = useState({ lat: "", lng: "" });
  const [coordLines, setCoordLines] = useState([]);
  const [formattedDate, setFormattedDate] = useState("날짜 정보 없음");
  const location = useLocation();
  const reportId = location.state;

  const initData = {
    beachName: "",
    beachLength: 0,
    reportTime: "",
    researchers: "",
    estimatedTrash: "50L 마대",
    trashBags: 0,
    totalVolume: 0,
    recentDisaster: "집",
    weather: "",
    latitude: "",
    longitude: "",
    mapImage: "",
  };

  const [detailData, setDetailData] = useState(initData);
  const [imgs, setImgs] = useState([]);

  const fetchNewWorksDetail = async () => {
    try {
      const response = await getNewWorksDetail(reportId);
      console.log("------------newTasksDetail get response: ", response);
      if (response.data.reportTime) {
        const date = new Date(response.data.reportTime);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        setFormattedDate(`${year}/${month}/${day} ${hours}:${minutes}`);
      }
      if (
        response.data.researchSubList &&
        response.data.researchSubList.length > 0
      ) {
        response.data.researchSubList.map((sub) => {
          const start = { lat: sub.startLatitude, lng: sub.startLongitude };
          const end = { lat: sub.endLatitude, lng: sub.endLongitude };
          const data = { start: start, end: end };
          setCoordLines((prev) => [...prev, data]);
        });
      }
      setMyCoords({
        lat: coordLines[0]?.start?.lat,
        lng: coordLines[0]?.start?.lng,
      });
      setDetailData((prevData) => ({
        ...prevData,
        beachName: response.data.beachName,
        totalVolume: response.data.expectedTrashAmount,
        reportTime: formattedDate,
        researchers: response.data.researcherName,
        recentDisaster: response.data.specialNote,
        beachLength: response.data.totalBeachLength,
        weather: response.data.weather,
      }));

      if (
        response.data &&
        response.data.images &&
        response.data.images.length > 0
      ) {
        const fetchImages = async () => {
          try {
            // 이미지 배열을 비동기로 처리하고 모든 작업이 끝나길 기다림
            const imgUrls = await Promise.all(
              response.data.images.map(async (img) => {
                return await getImageByFileName(img);
              })
            );
            // 이미지를 상태로 저장
            setImgs([...imgUrls]);
          } catch (error) {
            console.error("Error fetching images:", error);
          }
        };
        fetchImages();
      }
    } catch (error) {
      console.error("데이터 검색 중 오류 발생:", error);
    }
  };

  useEffect(() => {
    if (!isLoggedIn || role !== "ADMIN") {
      navigate("/", { replace: true });
    }
  }, [isLoggedIn, role, navigate]);

  useEffect(() => {
    fetchNewWorksDetail();
  });

  // 이미지 이동 함수
  const goToPreviousImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? imgs.length - 1 : prevIndex - 1
    );
  };

  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === imgs.length - 1 ? 0 : prevIndex + 1
    );
  };

  // 모달 열기/닫기 함수
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);
  const openApprovalModal = () => setIsApprovalModalOpen(true);
  const closeApprovalModal = () => setIsApprovalModalOpen(false);

  const handleApprove = () => {
    setIsApprovalModalOpen(false);
    navigate(-1); // 승인 시 목록으로 이동
  };

  return (
    <SidebarLayout>
      <div className="min-h-screen bg-gray-100 py-8 px-28">
        <Link to={"/newWorks"}>
          <h1 className="text-xl font-bold mb-2 text-blue-700">New 작업</h1>
        </Link>
        {/* 보고서 폼 */}
        <div className="bg-white rounded-lg shadow px-32 py-14">
          <h1 className="text-xl font-bold mb-6 text-black text-center">
            조사 보고서
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-24">
            {/* 왼쪽 열: 해안가 사진과 지도 */}
            <div className="space-y-6 relative">
              <div>
                <h2 className="mb-2 text-center font-semibold bg-gray-100 border py-1 border-gray-300 rounded-sm">
                  해안가 오염도 사진
                </h2>
                <div className="relative">
                  <img
                    src={imgs[currentImageIndex]}
                    alt="해안가 오염도 사진"
                    className="w-full h-64 rounded-md object-cover cursor-pointer"
                    onClick={openModal} // 이미지 클릭 시 모달 열기
                  />
                  <button
                    onClick={goToPreviousImage}
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full"
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  <button
                    onClick={goToNextImage}
                    className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full"
                  >
                    <FiChevronRight size={24} />
                  </button>
                </div>
                <div className="flex justify-between w-full mt-3 gap-2">
                  {imgs.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className={`w-1/3 h-24 rounded-md object-cover cursor-pointer ${
                        index === currentImageIndex
                          ? "border-2 border-blue-500"
                          : "border"
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <h2 className="mb-2 text-center font-semibold bg-gray-100 border py-1 border-gray-300 rounded-sm">
                  조사 위치
                </h2>
                <div className="flex flex-col items-center bg-white rounded-lg shadow mb-8 w-full h-64">
                  <KakaoMap myCoords={myCoords} lines={coordLines} />
                  <p className="text-center text-sm text-gray-500 mt-2">
                    구역 클릭 시 상세정보를 볼 수 있습니다
                  </p>
                </div>
              </div>
            </div>

            {/* 오른쪽 열: 해안 정보 */}
            <div className="flex flex-col  h-full space-y-10">
              <DataDisplay label="해안명" value={detailData.beachName} />
              <DataDisplay
                label="해안 길이(m)"
                value={`${detailData.beachLength}`}
              />
              <DataDisplay label="조사 일자" value={detailData.reportTime} />
              <DataDisplay label="조사 인원" value={detailData.researchers} />
              <div className="flex flex-col space-y-2">
                <label className="block text-gray-700 text-sm mb-1 font-semibold">
                  <img src={dot} alt="dot" className="w-1 me-2 inline" /> 쓰레기
                  예측량(50L 마대)
                </label>
                <div className="flex space-x-2">
                  <p className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 w-1/2">
                    {Math.ceil(detailData.totalVolume / 50)}개
                  </p>
                  <p className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 w-1/2">
                    {detailData.totalVolume}
                  </p>
                </div>
              </div>
              <DataDisplay
                label="자연재해 유무(최근 5일 이내)"
                value={detailData.recentDisaster}
              />
              <DataDisplay label="날씨" value={detailData.weather} />
              <div className="flex w-full space-x-2">
                <DataDisplay
                  className="w-1/2"
                  label="위도"
                  value={coordLines[0]?.start?.lat.toFixed(6) || "0"}
                />
                <DataDisplay
                  className="w-1/2"
                  label="경도"
                  value={coordLines[0]?.start?.lng.toFixed(6) || "0"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => navigate(-1)} // 이전 페이지로 이동
            className="w-24 h-12 bg-gray-300 text-gray-700 px-4 py-2 mr-4 rounded-md hover:bg-gray-400 transition"
          >
            목록
          </button>
          <button
            onClick={openApprovalModal} // 승인 클릭 시 승인 모달 열기
            className="w-24 h-12 bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition"
          >
            배정
          </button>
        </div>
      </div>

      {/* 승인 모달 */}
      {isApprovalModalOpen && (
        <SubmitModal
          message={`‘${detailData.reportTime} ${detailData.beachName}’에\n 청소자를 배정하시겠습니까?`}
          confirmText="배정완료"
          cancelText="취소"
          onConfirm={handleApprove}
          onCancel={closeApprovalModal}
        />
      )}

      {/* 이미지 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
          <div className="relative bg-white rounded-sm p-1">
            <div className="relative">
              <img
                src={imgs[currentImageIndex]}
                alt="큰 해안가 사진"
                className="max-w-full max-h-screen object-contain"
              />
              {/* X 버튼을 이미지 위에 배치 */}
              <button
                onClick={closeModal}
                className="absolute top-2 right-2 w-7 h-7 bg-gray-800 bg-opacity-60 text-white  rounded-full hover:bg-opacity-80"
              >
                X
              </button>
              <button
                onClick={goToPreviousImage}
                className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full"
              >
                <FiChevronLeft size={24} />
              </button>
              <button
                onClick={goToNextImage}
                className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full"
              >
                <FiChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  );
};

// 데이터를 표시하는 공통 컴포넌트
const DataDisplay = ({ label, value, className }) => {
  return (
    <div className={className}>
      <label className="block text-gray-700 text-sm mb-1 font-semibold">
        <img src={dot} alt="dot" className="w-1 me-2 inline" />
        {label}
      </label>
      <p className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
        {value}
      </p>
    </div>
  );
};

export default ResearchReportPage;
