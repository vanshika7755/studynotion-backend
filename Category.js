const Category = require("../Models/Category");
const mongoose = require("mongoose");

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description) {
      return res.status(400).json({ success: false, message: "Fill all the required fields" });
    }

    const categoryDetails = await Category.create({ name, description });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: categoryDetails,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error while creating the Category" });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const allCategory = await Category.find({}, { name: true, description: true }).lean();

    return res.status(200).json({
      success: true,
      message: "All categories fetched successfully",
      data: allCategory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error while fetching the Category" });
  }
};

exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ success: false, message: "Valid categoryId is required" });
    }

    // Populate the field exactly as in your Category schema (looks like 'course')
    const selectedCategory = await Category.findById(categoryId)
      .populate("course")
      .lean();

    if (!selectedCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const differentCategories = await Category.find({ _id: { $ne: categoryId } })
      .populate("course")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Successfully fetched category page",
      data: {
        selectedCategory,
        differentCategories,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Failed to fetch category page" });
  }
};
