



function parsePagination(query = {}) {
  let limit = parseInt(query.limit, 10);
  let offset = parseInt(query.offset, 10);
  const page = parseInt(query.page, 10);

  if (Number.isNaN(limit) || limit < 1) limit = 50;
  if (limit > 200) limit = 200;

  if (!Number.isNaN(page) && page >= 1) {
    offset = (page - 1) * limit;
  } else if (Number.isNaN(offset) || offset < 0) {
    offset = 0;
  }

  return { limit, offset, page: page >= 1 ? page : Math.floor(offset / limit) + 1 };
}




function paginatedResponse(rows, total, { limit, offset, page }) {
  return {
    data: rows,
    pagination: {
      total: Number(total),
      limit,
      offset,
      page,
      totalPages: Math.ceil(Number(total) / limit) || 1
    }
  };
}

module.exports = { parsePagination, paginatedResponse };