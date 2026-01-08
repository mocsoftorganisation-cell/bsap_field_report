const CompanyService = require('../services/companyService');



// GET /api/modules - Get all modules with pagination
async function list(req, res) {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'priority', 
      sortOrder = 'ASC',
      search,
      status 
    } = req.query;

    // Validate and sanitize pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit))); // Cap at 100 items per page

    const options = {
      page: pageNum,
      limit: limitNum,
      sortBy,
      sortOrder: sortOrder.toUpperCase(),
      search,
      status
    };

    const result = await CompanyService.getAllCompany(options);
    
    res.json({
      status: 'SUCCESS',
      message: 'companies retrieved successfully',
      data: result.companies,
      pagination: {
        total: result.total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(result.total / options.limit),
        hasNextPage: options.page < Math.ceil(result.total / options.limit),
        hasPrevPage: options.page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve Companies',
      error: error.message
    });
  }
}

// POST /api/modules - Create new Company
async function create(req, res) {
  try {
    const companyData = {
      ...req.body,
      createdBy: req.user.id,
      updatedBy: req.user.id
    };

    const company = await CompanyService.createCompany(companyData);
    
    res.status(201).json({
      status: 'SUCCESS',
      message: 'Company created successfully',
      data: company
    });
  } catch (error) {
    console.log(error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Company with this name or code already exists'
      });
    }
    
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to create Company',
      error: error.message
    });
  }
}

// PUT /api/modules/:id - Update module
async function update(req, res) {
  try {
    const { id } = req.params;
    const companyData = {
      ...req.body,
      updatedBy: req.user.id
    };

    const company = await CompanyService.updateCompany(id, companyData);
    
    if (!company) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'Company not found'
      });
    }

    res.json({
      status: 'SUCCESS',
      message: 'Company updated successfully',
      data: company
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Company with this name or code already exists'
      });
    }
    
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to update company',
      error: error.message
    });
  }
}


module.exports = {
    list,
    create,
    update,
}