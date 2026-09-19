import Joi from 'joi';

export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Auth validation schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).max(255).required()
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(255).required(),
  newPassword: Joi.string().min(8).max(255).required()
});

// User validation schemas
export const userCreateSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer').required(),
  company_id: Joi.string().when('role', {
    is: Joi.string().valid('admin', 'manager', 'storeman', 'salesman'),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  store_id: Joi.string().when('role', {
    is: Joi.string().valid('manager', 'storeman', 'salesman'),
    then: Joi.optional(),
    otherwise: Joi.optional()
  }),
  retailer_id: Joi.number().when('role', {
    is: 'retailer',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

export const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  email: Joi.string().email(),
  role: Joi.string().valid('super_admin', 'admin', 'manager', 'storeman', 'salesman', 'retailer'),
  company_id: Joi.string().allow(null),
  store_id: Joi.string().allow(null),
  retailer_id: Joi.number().allow(null),
  is_active: Joi.boolean()
});

// Company validation schemas
export const companyCreateSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  address: Joi.string().max(1000),
  contact_email: Joi.string().email(),
  contact_phone: Joi.string().max(50),
  logo_url: Joi.string().uri().allow('')
});

export const companyUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  address: Joi.string().max(1000),
  contact_email: Joi.string().email().allow('', null),
  contact_phone: Joi.string().max(50).allow('', null),
  logo_url: Joi.string().uri().allow('', null)
}).min(1);

// Store validation schemas
export const storeCreateSchema = Joi.object({
  Branch_Code: Joi.string().min(1).max(15).required(),
  Branch_Name: Joi.string().max(255),
  Company_Name: Joi.string().max(255),
  Branch_Address: Joi.string().max(1000),
  Branch_Phone: Joi.string().max(50),
  Branch_Email: Joi.string().email(),
  Branch_Manager: Joi.string().max(255),
  Branch_URL: Joi.string().max(255),
  Branch_Manager_Mobile: Joi.string().max(50),
  company_id: Joi.string().required()
});

export const storeUpdateSchema = Joi.object({
  Branch_Name: Joi.string().max(255),
  Company_Name: Joi.string().max(255),
  Branch_Address: Joi.string().max(1000),
  Branch_Phone: Joi.string().max(50),
  Branch_Email: Joi.string().email().allow('', null),
  Branch_Manager: Joi.string().max(255),
  Branch_URL: Joi.string().max(255),
  Branch_Manager_Mobile: Joi.string().max(50),
  company_id: Joi.string()
}).min(1);

// Retailer validation schemas
export const retailerCreateSchema = Joi.object({
  Retailer_Name: Joi.string().max(255),
  Retailer_Address: Joi.string().max(1000),
  Retailer_Mobile: Joi.string().max(50),
  Contact_Person: Joi.string().max(255),
  Retailer_Email: Joi.string().email(),
  GST_No: Joi.string().max(50),
  Credit_Limit: Joi.number().min(0),
  Area_Name: Joi.string().max(255),
  Pincode: Joi.string().max(20)
});

export const retailerUpdateSchema = Joi.object({
  Retailer_Name: Joi.string().max(255),
  Retailer_Address: Joi.string().max(1000),
  Retailer_Mobile: Joi.string().max(50),
  Contact_Person: Joi.string().max(255),
  Retailer_Email: Joi.string().email().allow('', null),
  GST_No: Joi.string().max(50).allow('', null),
  Credit_Limit: Joi.number().min(0),
  Area_Name: Joi.string().max(255).allow('', null),
  Pincode: Joi.string().max(20).allow('', null),
  Retailer_Status: Joi.number().integer().valid(0, 1),
  Confirm: Joi.number().integer().valid(0, 1)
}).min(1);

// Region validation schemas
export const regionCreateSchema = Joi.object({
  id: Joi.string().min(1).max(50).required(),
  name: Joi.string().min(2).max(255).required(),
  store_id: Joi.string().max(15).required()
});

export const regionUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  store_id: Joi.string().max(15)
}).min(1);

// Part validation schemas
export const partCreateSchema = Joi.object({
  Part_Number: Joi.string().max(100).required(),
  Part_Name: Joi.string().max(255),
  Part_Price: Joi.number().min(0),
  Part_MinQty: Joi.number().min(0),
  Part_BasicDisc: Joi.number().min(0).max(100),
  Part_SchemeDisc: Joi.number().min(0).max(100),
  Part_AdditionalDisc: Joi.number().min(0).max(100),
  Part_Application: Joi.string().max(1000),
  Part_Catagory: Joi.string().max(100),
  Focus_Group: Joi.string().max(100),
  Item_Status: Joi.string().valid('Active', 'Inactive', 'Discontinued')
});

export const partUpdateSchema = Joi.object({
  Part_Name: Joi.string().max(255),
  Part_Price: Joi.number().min(0),
  Part_MinQty: Joi.number().min(0),
  Part_BasicDisc: Joi.number().min(0).max(100),
  Part_SchemeDisc: Joi.number().min(0).max(100),
  Part_AdditionalDisc: Joi.number().min(0).max(100),
  Part_Application: Joi.string().max(1000),
  Part_Catagory: Joi.string().max(100),
  Focus_Group: Joi.string().max(100),
  Item_Status: Joi.string().valid('Active', 'Inactive', 'Discontinued'),
  Is_Order_Pad: Joi.number().integer().valid(0, 1),
  Order_Pad_Category: Joi.number().integer(),
  T1: Joi.number().integer().min(0),
  T2: Joi.number().integer().min(0),
  T3: Joi.number().integer().min(0),
  T4: Joi.number().integer().min(0),
  T5: Joi.number().integer().min(0),
  GuruPoint: Joi.number().integer().min(0),
  ChampionPoint: Joi.number().integer().min(0),
  Alternate_PartNumber: Joi.string().max(500),
  Previous_PartNumber: Joi.string().max(100),
  Part_Discount: Joi.string().max(10),
  Part_Image: Joi.string().uri().allow('', null)
}).min(1);

export const orderStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('New', 'Pending', 'Processing', 'Hold', 'Picked', 'Dispatched', 'Completed', 'Cancelled').required(),
  notes: Joi.string().max(1000).allow('', null)
});

// Order validation schemas
export const orderCreateSchema = Joi.object({
  retailer_id: Joi.number().required(),
  po_number: Joi.string().max(50).allow(''),
  po_date: Joi.date().iso(), // optional but validated if present
  urgent: Joi.boolean(),
  remark: Joi.string().max(1000).allow(''),
  items: Joi.array().items(
    Joi.object({
      part_number: Joi.string().required(),
      part_name: Joi.string().max(100).optional(), // allow but not required
      quantity: Joi.number().min(1).max(9999).required(),
      mrp: Joi.number().min(0).required(),
      basic_discount: Joi.number().min(0).max(100),
      scheme_discount: Joi.number().min(0).max(100),
      additional_discount: Joi.number().min(0).max(100),
      urgent: Joi.boolean()
    })
  ).min(1).max(200).required()
});
