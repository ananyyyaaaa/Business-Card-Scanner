import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import IpRequest from '../models/IpRequest.js';
import User from '../models/User.js';

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      const token = jwt.sign({ id: admin._id, isAdmin: true }, process.env.JWT_SECRET, {
        expiresIn: '30d',
      });

      res.json({
        success: true,
        token,
      });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all IP requests
// @route   GET /api/admin/ip-requests
// @access  Private (Admin)
const getIpRequests = async (req, res) => {
  try {
    const requests = await IpRequest.find()
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'email');

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error('Get IP requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve or reject IP request
// @route   PUT /api/admin/ip-requests/:id
// @access  Private (Admin)
const approveIpRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    const adminId = req.admin?.id;

    const request = await IpRequest.findById(id);

    if (!request) {
      return res.status(404).json({ message: 'IP request not found' });
    }

    request.approved = approved;
    request.approvedBy = adminId;
    request.approvedAt = new Date();
    await request.save();

    if (approved) {
      // Add IP to user's approved IPs
      const user = await User.findById(request.userId);
      if (user) {
        const ipExists = user.approvedIps.some(ip => ip.ip === request.ipAddress);
        if (!ipExists) {
          user.approvedIps.push({
            ip: request.ipAddress,
            countryCode: request.countryCode,
            countryName: request.countryName,
            approvedAt: new Date(),
          });
          await user.save();
        }
      }
    }

    res.json({
      success: true,
      message: `IP request ${approved ? 'approved' : 'rejected'}`,
      data: request,
    });
  } catch (error) {
    console.error('Approve IP request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export { adminLogin, getIpRequests, approveIpRequest };

