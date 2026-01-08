const Company = require('../models/Company');

const { Op } = require('sequelize');
class CompanyService {

     // Get all modules with pagination and filtering
  static async getAllCompany(options = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'priority',
      sortOrder = 'ASC',
      search,
      active
    } = options;

    const offset = (page - 1) * limit;
    const whereClause = {};

    if (search) {
      whereClause[Op.or] = [
        { companyName: { [Op.like]: `%${search}%` } }
      ];
    }

    if (active !== undefined) {
      whereClause.active = active;
    }

    const { count, rows } = await Company.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [[sortBy, sortOrder]]
    });

    return {
      companies: rows.map(company => company.toJSON()),
      total: count
    };
  }
    
    static async createCompany(companyData) {
            console.log("companyData",companyData);
            console.log("company service");
            console.log("DEBUG: Company Model Loaded =", Company);
        const company = await Company.create(companyData);
        return company;
    }

     // Update Company by ID
  static async updateCompany(id, companyData) {
    const company = await Company.findByPk(id);
    if (!company) return null;

    // Update the company
    await company.update(companyData);
    return await this.getCompanyById(id);

  }

  // Get module by ID
  static async getCompanyById(id) {
  return await Company.findByPk(id);
}

}


module.exports = CompanyService;
