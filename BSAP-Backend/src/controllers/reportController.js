const reportService = require('../services/reportService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Main report generation endpoint
 * POST /api/reports/getReport
 */
async function getReport(req, res) {
  const startTime = Date.now();
  
  try {
    // Log the request
    logger.info('Report generation request received', {
      userId: req.user.id,
      userRole: req.user.role,
      battalionId: req.user.battalionId,
      rangeId: req.user.rangeId,
      requestBody: req.body,
      timestamp: new Date().toISOString()
    });

    // Validate required fields
    const { reportType } = req.body;
    if (!reportType) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Report type is required',
        error: {
          code: 'VALIDATION_ERROR',
          type: 'REQUEST_VALIDATION',
          details: {
            reportType: 'Report type is required and must be one of: SUMMARY, DETAILED, COMPARISON, TREND, PERFORMANCE, COMPLIANCE'
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate report type
    const validReportTypes = ['SUMMARY', 'DETAILED', 'COMPARISON', 'TREND', 'PERFORMANCE', 'COMPLIANCE'];
    if (!validReportTypes.includes(reportType)) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid report type',
        error: {
          code: 'VALIDATION_ERROR',
          type: 'REQUEST_VALIDATION',
          details: {
            reportType: `Report type must be one of: ${validReportTypes.join(', ')}`
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    // Apply user-based access restrictions
    const requestWithUserContext = applyUserAccessRestrictions(req.body, req.user);

    // Validate pagination parameters
    const validationErrors = validatePaginationAndFilters(requestWithUserContext);
    if (Object.keys(validationErrors).length > 0) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Request validation failed',
        error: {
          code: 'VALIDATION_ERROR',
          type: 'REQUEST_VALIDATION',
          details: validationErrors
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generate report
    const reportResult = await reportService.generateReport(requestWithUserContext, req.user);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Log successful generation
    logger.info('Report generated successfully', {
      userId: req.user.id,
      reportType: requestWithUserContext.reportType,
      recordsReturned: reportResult.data ? reportResult.data.length : 0,
      processingTimeMs: processingTime,
      reportId: reportResult.metadata?.reportId
    });

    // Return successful response
    res.json({
      status: 'SUCCESS',
      message: 'Report generated successfully',
      data: reportResult,
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    // Log error
    logger.error('Report generation failed', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime,
      requestBody: req.body
    });

    // Handle specific error types
    if (error.message.includes('No data found')) {
      return res.status(404).json({
        status: 'ERROR',
        message: 'No data found for the specified criteria',
        error: {
          code: 'NO_DATA_FOUND',
          type: 'DATA_RETRIEVAL',
          details: {
            reason: error.message,
            suggestions: [
              'Try expanding the date range',
              'Remove some filters to broaden the search',
              'Check if data has been submitted for the selected period'
            ],
            filtersApplied: req.body
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Access denied',
        error: {
          code: 'UNAUTHORIZED',
          type: 'ACCESS_DENIED',
          details: {
            reason: error.message,
            userRole: req.user?.role,
            allowedBattalions: req.user?.battalionId ? [req.user.battalionId] : [],
            requestedBattalions: req.body.battalionIds || (req.body.battalionId ? [req.body.battalionId] : [])
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    if (error.message.includes('timeout') || processingTime > 30000) {
      return res.status(408).json({
        status: 'ERROR',
        message: 'Request timed out',
        error: {
          code: 'TIMEOUT',
          type: 'PERFORMANCE',
          details: {
            reason: 'Query execution exceeded maximum allowed time of 30 seconds',
            executionTime: `${processingTime}ms`,
            suggestions: [
              'Reduce the date range',
              'Add more specific filters',
              'Use pagination with smaller page sizes',
              'Consider using SUMMARY report type instead of DETAILED'
            ]
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    // Generic server error
    res.status(500).json({
      status: 'ERROR',
      message: 'Internal server error',
      error: {
        code: 'INTERNAL_ERROR',
        type: 'SYSTEM',
        details: {
          reason: 'An unexpected error occurred while generating the report',
          errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          supportMessage: 'Please contact support with the error ID if the problem persists'
        }
      },
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Export report endpoint
 * GET /api/reports/export/:reportId
 */
// async function exportReport(req, res) {
//   try {
//     const { reportId } = req.params;
//     const { format } = req.query;

//     if (!reportId || !format) {
//       return res.status(400).json({
//         status: 'ERROR',
//         message: 'Report ID and format are required'
//       });
//     }

//     const validFormats = ['CSV', 'PDF', 'EXCEL'];
//     if (!validFormats.includes(format)) {
//       return res.status(400).json({
//         status: 'ERROR',
//         message: `Invalid format. Must be one of: ${validFormats.join(', ')}`
//       });
//     }

//     const exportResult = await reportService.exportReport(reportId, format, req.user);

//     // Set appropriate headers for file download
//     res.setHeader('Content-Type', exportResult.contentType);
//     res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
//     res.setHeader('Content-Length', exportResult.buffer.length);

//     res.send(exportResult.buffer);

//   } catch (error) {
//     logger.error('Report export failed', {
//       userId: req.user?.id,
//       reportId: req.params.reportId,
//       format: req.query.format,
//       error: error.message
//     });

//     res.status(500).json({
//       status: 'ERROR',
//       message: 'Failed to export report',
//       error: error.message
//     });
//   }
// }





// sonammm
async function exportReport(req, res) {
  const startTime = Date.now();
  logger.info('📤 Export report request initiated');

  try {
    const { reportId } = req.params;
    const format = (req.query?.format || '').toUpperCase();

    // 🧩 Validate input
    if (!reportId) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Report ID is required',
        error: {
          code: 'VALIDATION_ERROR',
          type: 'REQUEST_VALIDATION',
          details: { reportId: 'Report ID must be provided to export a report' },
        },
        timestamp: new Date().toISOString(),
      });
    }

    const validFormats = ['EXCEL', 'PDF', 'CSV'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid export format',
        error: {
          code: 'VALIDATION_ERROR',
          type: 'REQUEST_VALIDATION',
          details: { format: `Format must be one of: ${validFormats.join(', ')}` },
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 🧠 Export from service
    const exportResult = await reportService.exportReport(reportId, format, req.user);

    // 🕵️‍♂️ Check if data exists
console.log("✅ Export result received:", Object.keys(exportResult));
    
    if (!exportResult || !exportResult.nodeBuffer) {
      logger.warn('⚠️ No report data found for export', { reportId });
      return res.status(404).json({
        status: 'ERROR',
        message: 'No report data available for export',
        error: {
          code: 'NO_DATA_FOUND',
          type: 'DATA_RETRIEVAL',
          details: {
            reportId,
            reason: 'Report data not found or already expired',
            suggestions: [
              'Generate the report again before exporting',
              'Ensure the report ID is correct and valid',
            ],
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    // ✅ Success log
    const processingTime = Date.now() - startTime;
    logger.info('✅ Report exported successfully', {
      userId: req.user?.id || 'anonymous',
      reportId,
      format,
      fileName: exportResult.fileName,
      processingTimeMs: processingTime,
    });

    // 🧾 Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.fileName}"`);
    res.setHeader('Content-Type', exportResult.mimeType || 'application/octet-stream');

    // 📦 Send the file buffer directly
    // return res.status(200).send(exportResult.buffer);

    res.writeHead(200, {
  'Content-Disposition': `attachment; filename="${exportResult.fileName}"`,
  'Content-Type': exportResult.mimeType,
  'Content-Length': exportResult.nodeBuffer.length   // ✅ FIXED
});
return res.end(exportResult.nodeBuffer);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    logger.error('❌ Report export failed', {
      userId: req.user?.id || 'anonymous',
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime,
      params: req.params,
      query: req.query,
    });

    // 🛡️ Specific error handling
    if (error.message.includes('Access denied') || error.message.includes('Unauthorized')) {
      return res.status(403).json({
        status: 'ERROR',
        message: 'Access denied',
        error: {
          code: 'UNAUTHORIZED',
          type: 'ACCESS_DENIED',
          details: { reason: error.message, userRole: req.user?.role },
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (error.message.includes('File generation failed')) {
      return res.status(500).json({
        status: 'ERROR',
        message: 'Report file generation failed',
        error: {
          code: 'FILE_CREATION_ERROR',
          type: 'SYSTEM',
          details: {
            reason: error.message,
            suggestions: [
              'Try again after some time',
              'Ensure all dependencies for report generation are installed',
            ],
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (processingTime > 30000) {
      return res.status(408).json({
        status: 'ERROR',
        message: 'Export request timed out',
        error: {
          code: 'TIMEOUT',
          type: 'PERFORMANCE',
          details: {
            executionTime: `${processingTime}ms`,
            suggestions: [
              'Try exporting a smaller report',
              'Use CSV format for faster generation',
            ],
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 🔧 Generic fallback
    return res.status(500).json({
      status: 'ERROR',
      message: 'Internal server error during report export',
      error: {
        code: 'INTERNAL_ERROR',
        type: 'SYSTEM',
        details: {
          reason: error.message,
          errorId: `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }
}

// async function generateReport(req, res) {
//   const startTime = Date.now();

//   try {
//     logger.info('Generate report request received', {
//       userId: req.user?.id,
//       role: req.user?.role,
//       body: req.body,
//       timestamp: new Date().toISOString()
//     });

//     // 1️⃣ Validate input
//     const { reportType, fromDate, toDate, filters={} } = req.body;

//     if (!reportType) {
//       return res.status(400).json({
//         status: 'ERROR',
//         message: 'Report type is required',
//         error: { code: 'VALIDATION_ERROR', details: { reportType: 'Provide a valid report type' } }
//       });
//     }

//     if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
//       return res.status(400).json({
//         status: 'ERROR',
//         message: 'Invalid date range',
//         error: { code: 'VALIDATION_ERROR', details: { dateRange: 'From date cannot be after To date' } }
//       });
//     }

//     // 2️⃣ Create unique report ID (for export later)
//     const reportId = uuidv4();
// const finalFilters = {
//   ...filters, // spread actual filters like battalionIds, moduleId, topicIds, etc.
//   reportType,
//   fromDate,
//   toDate,
//   reportId,
//   requestedBy: req.user?.id
// };


//     // 3️⃣ Generate report data from DB (via service)
//     // const reportResult = await reportService.generateReport({
//     //   reportType,
//     //   fromDate,
//     //   toDate,
//     //   filters,
//     //   reportId,
//     //   requestedBy: req.user?.id
//     // });
//     const reportResult = await reportService.generateReport(finalFilters);


//     if (!reportResult || !reportResult.data || reportResult.data.length === 0) {
//   const reportId = uuidv4(); // still create one for logging/export
//   return res.status(200).json({
//     status: 'SUCCESS',
//     message: 'Report generated successfully (no matching data)',
//     data: {
//       metadata: {
//         reportId,
//         reportType,
//         generatedAt: new Date().toISOString(),
//         recordCount: 0
//       },
//       data: [] // empty dataset
//     }
//   });
// }

//     // 4️⃣ Prepare metadata for export and frontend
//     const metadata = {
//       reportId,
//       reportType,
//       generatedAt: new Date().toISOString(),
//       recordCount: reportResult.data.length,
//       requestedBy: req.user?.id
//     };

//     const processingTime = Date.now() - startTime;

//     logger.info('Report generated successfully', {
//       reportId,
//       reportType,
//       recordCount: reportResult.data.length,
//       timeTakenMs: processingTime
//     });

//     // 5️⃣ Return response with reportId for frontend export
//     return res.status(200).json({
//       status: 'SUCCESS',
//       message: 'Report generated successfully',
//       data: {
//         metadata,
//         data: reportResult.data
//       },
//       timestamp: new Date().toISOString(),
//       processingTime: `${processingTime}ms`
//     });

//   } catch (error) {
//     const processingTime = Date.now() - startTime;

//     logger.error('Report generation failed', {
//       userId: req.user?.id,
//       error: error.message,
//       stack: error.stack,
//       timeTakenMs: processingTime
//     });

//     return res.status(500).json({
//       status: 'ERROR',
//       message: 'Internal server error while generating report',
//       error: {
//         code: 'INTERNAL_ERROR',
//         details: {
//           reason: error.message,
//           errorId: `ERR_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
//         }
//       }
//     });
//   }

// }

async function generateReport(req, res) {
  const startTime = Date.now();

  try {
    logger.info('Generate report request received', {
      userId: req.user?.id,
      role: req.user?.role,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    const { reportType, fromDate, toDate, filters = {} } = req.body;

    if (!reportType) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Report type is required',
        error: { code: 'VALIDATION_ERROR', details: { reportType: 'Provide a valid report type' } }
      });
    }

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({
        status: 'ERROR',
        message: 'Invalid date range',
        error: { code: 'VALIDATION_ERROR', details: { dateRange: 'From date cannot be after To date' } }
      });
    }

    // 🚫 REMOVE uuidv4() here — the service handles it!
    const finalFilters = {
      ...filters,
      reportType,
      fromDate,
      toDate,
      requestedBy: req.user?.id
    };

    const reportResult = await reportService.generateReport(finalFilters);

    if (!reportResult || !reportResult.data || reportResult.data.length === 0) {
      return res.status(200).json({
        status: 'SUCCESS',
        message: 'Report generated successfully (no matching data)',
        data: {
          metadata: {
            reportId: reportResult.metadata.reportId, // ✅ use the one from service
            reportType,
            generatedAt: new Date().toISOString(),
            recordCount: 0
          },
          data: []
        }
      });
    }

    const processingTime = Date.now() - startTime;

    logger.info('Report generated successfully', {
      reportId: reportResult.metadata.reportId, // ✅ use same ID from service
      reportType,
      recordCount: reportResult.data.length,
      timeTakenMs: processingTime
    });

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Report generated successfully',
      data: reportResult, // ✅ send entire service result as-is
      timestamp: new Date().toISOString(),
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error('Report generation failed', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack,
      timeTakenMs: processingTime
    });

    return res.status(500).json({
      status: 'ERROR',
      message: 'Internal server error while generating report',
      error: {
        code: 'INTERNAL_ERROR',
        details: {
          reason: error.message,
          errorId: `ERR_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        }
      }
    });
  }
}


/**
 * Get report templates endpoint
 * GET /api/reports/templates
 */
async function getReportTemplates(req, res) {
  try {
    const templates = await reportService.getReportTemplates(req.user);

    res.json({
      status: 'SUCCESS',
      message: 'Report templates retrieved successfully',
      data: templates,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to retrieve report templates', {
      userId: req.user?.id,
      error: error.message
    });

    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve report templates',
      error: error.message
    });
  }
}

/**
 * Get report metadata endpoint
 * GET /api/reports/metadata
 */
async function getReportMetadata(req, res) {
  try {
    const metadata = await reportService.getReportMetadata(req.user);

    res.json({
      status: 'SUCCESS',
      message: 'Report metadata retrieved successfully',
      data: metadata,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to retrieve report metadata', {
      userId: req.user?.id,
      error: error.message
    });

    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to retrieve report metadata',
      error: error.message
    });
  }
}

/**
 * Apply user-based access restrictions to report request
 */
function applyUserAccessRestrictions(request, user) {
  const restrictedRequest = { ...request };

  // Apply role-based restrictions
  switch (user.role) {
    case 'BATTALION_USER':
      // Battalion users can only access their own battalion data
      restrictedRequest.battalionId = user.battalionId;
      restrictedRequest.battalionIds = [user.battalionId];
      break;
      
    case 'RANGE_ADMIN':
      // Range admins can access all battalions in their range
      if (restrictedRequest.rangeId && restrictedRequest.rangeId !== user.rangeId) {
        throw new Error('Access denied: User cannot access data from other ranges');
      }
      restrictedRequest.rangeId = user.rangeId;
      break;
      
    case 'SYSTEM_ADMIN':
      // System admins have full access - no restrictions
      break;
      
    default:
      // Default to battalion-level access
      restrictedRequest.battalionId = user.battalionId;
      restrictedRequest.battalionIds = [user.battalionId];
  }

  // Validate battalion access if specific battalions are requested
  if (restrictedRequest.battalionIds && user.role !== 'SYSTEM_ADMIN') {
    for (const battalionId of restrictedRequest.battalionIds) {
      if (user.role === 'BATTALION_USER' && battalionId !== user.battalionId) {
        throw new Error(`Access denied: User cannot access battalion ID ${battalionId}`);
      }
    }
  }

  return restrictedRequest;
}

/**
 * Validate pagination and filter parameters
 */
function validatePaginationAndFilters(request) {
  const errors = {};

  // Validate pagination
  if (request.page !== undefined && request.page < 0) {
    errors.page = 'Page number must be non-negative';
  }

  if (request.size !== undefined && (request.size < 1 || request.size > 1000)) {
    errors.size = 'Page size must be between 1 and 1000';
  }

  // Validate date range
  if (request.fromDate && request.toDate) {
    const fromDate = new Date(request.fromDate);
    const toDate = new Date(request.toDate);
    
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      errors.dateFormat = 'Date format must be yyyy-MM-dd\'T\'HH:mm:ss';
    } else if (fromDate > toDate) {
      errors.dateRange = 'fromDate cannot be after toDate';
    }
  }

  // Validate battalion IDs limit
  if (request.battalionIds && request.battalionIds.length > 50) {
    errors.battalionIds = 'Maximum 50 battalions allowed';
  }

  // Validate sort parameters
  const validSortFields = ['battalionName', 'moduleName', 'topicName', 'lastUpdated', 'createdAt', 'completionRate', 'value'];
  if (request.sortBy && !validSortFields.includes(request.sortBy)) {
    errors.sortBy = `Sort field must be one of: ${validSortFields.join(', ')}`;
  }

  const validSortDirections = ['ASC', 'DESC'];
  if (request.sortDirection && !validSortDirections.includes(request.sortDirection)) {
    errors.sortDirection = `Sort direction must be one of: ${validSortDirections.join(', ')}`;
  }

  // Validate group by and aggregation
  if (request.groupBy && request.aggregationType) {
    const validGroupBy = ['BATTALION', 'MODULE', 'TOPIC', 'MONTH', 'QUARTER', 'YEAR'];
    const validAggregation = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'];
    
    if (!validGroupBy.includes(request.groupBy)) {
      errors.groupBy = `Group by must be one of: ${validGroupBy.join(', ')}`;
    }
    
    if (!validAggregation.includes(request.aggregationType)) {
      errors.aggregationType = `Aggregation type must be one of: ${validAggregation.join(', ')}`;
    }
  }

  return errors;
}




module.exports = {
  getReport,
  exportReport,
  getReportTemplates,
  getReportMetadata,
  generateReport,
};
