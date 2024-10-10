const ListCountAndSort = ({ totalCount }) => {
  return (
    <div className="flex justify-between items-center w-full mb-2">
      <p>총 {totalCount}건</p>
      <select className="border px-2 py-1 rounded">
        <option>최신순</option>
        <option>오래된 순</option>
      </select>
    </div>
  );
};

export default ListCountAndSort;