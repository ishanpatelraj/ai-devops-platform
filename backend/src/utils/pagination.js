/**
* Calculates MongoDB skip value from page/limit.
* Page 1, limit 10 → skip 0 (records 1-10)
* Page 2, limit 10 → skip 10 (records 11-20)
*/

const paginate = (query, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    return {
        skip,
        limit: parseInt(limit),
        page: parseInt(page),
    };
};

/**
* Wraps data in a standard paginated API response shape.
*/

const paginateResponse = (data, total, page, limit) => {
    return{
        data,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
        }
    };
};

module.exports = {paginate, paginateResponse};