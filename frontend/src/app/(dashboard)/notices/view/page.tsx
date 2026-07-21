import EmployeeNoticeList from "@/components/notice/EmployeeNoticeList";

export default function EmployeeNoticesPage() {
  return (
    <div className="mx-auto flex h-[calc(100vh-100px)] max-w-[1600px] flex-col p-6">
      <EmployeeNoticeList />
    </div>
  );
} 