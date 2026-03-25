import { useState } from "react";

export default function usePagination(items, perPage = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(items.length / perPage);

  const currentItems = items.slice((page - 1) * perPage, page * perPage);

  return {
    page,
    setPage,
    totalPages,
    currentItems,
  };
}
