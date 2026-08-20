function parsePagination(query, defaults = { page: 1, limit: 20 }) {
  let page = parseInt(query.page, 10) || defaults.page;
  let limit = parseInt(query.limit, 10) || defaults.limit;
  if (page < 1) page = 1;
  if (limit < 1) limit = defaults.limit;
  if (limit > 100) limit = 100;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function paginatedResponse(rows, total, page, limit) {
  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
}

module.exports = { parsePagination, paginatedResponse };
