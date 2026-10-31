import asyncHandler from "../utils/asyncHandler.ts";
import AppError from "../utils/error.ts";
import { Request, Response } from "express";
import { User } from "../models/User.model.ts";
import { getRestaurantById } from "../repository/Restaurant.repository.ts";
import { getUserByEmail, getUserByPhoneNumber } from "../repository/User.repository.ts";
import { getParamString } from "../services/restaurantEmployee.service.ts";
import {
    addEmployee,
    getEmployeesByRestaurantId,
    getEmployeeById,
    getEmployeeByRestaurantAndUserId,
    updateEmployeeRole,
    updateEmployeeStatus,
    removeEmployee,
    getRestaurantsByUserId,
} from "../repository/RestaurantEmployee.repository.ts";
import {
    RequestBodyAddEmployee,
    RequestBodyUpdateEmployeeRole,
    RequestBodyUpdateEmployeeStatus,
} from "../schema/restaurantEmployee.schema.ts";
import { verifyRestaurantOwner } from "../services/restaurantEmployee.service.ts";

interface AuthenticatedRequest extends Request {
    user?: User;
}

export const addEmployeeToRestaurant = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const { restaurant, restaurantId } = await verifyRestaurantOwner(
            req.user,
            req.params.restaurantId || req.params.id
        );

        const body: RequestBodyAddEmployee = req.body;
        const targetEmail = body.email?.trim().toLowerCase();
        const targetPhone = body.phone_no?.trim();

        let targetUser: User | null = null;
        if (targetEmail) {
            targetUser = await getUserByEmail(targetEmail);
        } else if (targetPhone) {
            targetUser = await getUserByPhoneNumber(targetPhone);
        }

        if (!targetUser) {
            throw new AppError("User not found with provided email or phone number", 404);
        }

        if (String(targetUser.id) === String(restaurant.owner_id)) {
            throw new AppError("The restaurant owner cannot be added as an employee", 400);
        }

        const targetUserId = parseInt(targetUser.id, 10);
        const existingEmployee = await getEmployeeByRestaurantAndUserId(restaurantId, targetUserId);
        if (existingEmployee) {
            throw new AppError("User is already an employee in this restaurant", 409);
        }

        const employee = await addEmployee({
            restaurant_id: restaurantId,
            user_id: targetUserId,
            role: body.role,
            status: body.status,
        });

        return res.status(201).json({
            success: true,
            message: "Employee added successfully",
            data: employee,
        });
    }
);

export const getRestaurantEmployees = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        const restaurantId = getParamString(req.params.restaurantId || req.params.id);

        if (!user || !restaurantId) {
            throw new AppError("Access denied", 403);
        }

        const restaurant = await getRestaurantById(restaurantId);
        if (!restaurant) {
            throw new AppError("Access denied", 403);
        }

        const isOwner = String(restaurant.owner_id) === String(user.id);
        const isEmployee = await getEmployeeByRestaurantAndUserId(
            restaurantId,
            parseInt(user.id, 10)
        );

        if (!isOwner && !isEmployee) {
            throw new AppError("Access denied", 403);
        }

        const employees = await getEmployeesByRestaurantId(restaurantId);

        return res.status(200).json({
            success: true,
            message: "Employees fetched successfully",
            data: employees,
        });
    }
);

export const updateRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { restaurantId } = await verifyRestaurantOwner(
        req.user,
        req.params.restaurantId || req.params.id
    );

    const employeeIdRaw = getParamString(req.params.employeeId);
    const employeeId = employeeIdRaw ? parseInt(employeeIdRaw, 10) : NaN;

    if (Number.isNaN(employeeId)) {
        throw new AppError("Access denied", 403);
    }

    const employee = await getEmployeeById(employeeId);
    if (!employee || employee.restaurant_id !== restaurantId) {
        throw new AppError("Access denied", 403);
    }

    const body: RequestBodyUpdateEmployeeRole = req.body;
    const updated = await updateEmployeeRole(employeeId, body.role);

    return res.status(200).json({
        success: true,
        message: "Employee role updated successfully",
        data: updated,
    });
});

export const updateStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { restaurantId } = await verifyRestaurantOwner(
        req.user,
        req.params.restaurantId || req.params.id
    );

    const employeeIdRaw = getParamString(req.params.employeeId);
    const employeeId = employeeIdRaw ? parseInt(employeeIdRaw, 10) : NaN;

    if (Number.isNaN(employeeId)) {
        throw new AppError("Access denied", 403);
    }

    const employee = await getEmployeeById(employeeId);
    if (!employee || employee.restaurant_id !== restaurantId) {
        throw new AppError("Access denied", 403);
    }

    const body: RequestBodyUpdateEmployeeStatus = req.body;
    const updated = await updateEmployeeStatus(employeeId, body.status);

    return res.status(200).json({
        success: true,
        message: "Employee status updated successfully",
        data: updated,
    });
});

export const removeEmployeeFromRestaurant = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const { restaurantId } = await verifyRestaurantOwner(
            req.user,
            req.params.restaurantId || req.params.id
        );

        const employeeIdRaw = getParamString(req.params.employeeId);
        const employeeId = employeeIdRaw ? parseInt(employeeIdRaw, 10) : NaN;

        if (Number.isNaN(employeeId)) {
            throw new AppError("Access denied", 403);
        }

        const employee = await getEmployeeById(employeeId);
        if (!employee || employee.restaurant_id !== restaurantId) {
            throw new AppError("Access denied", 403);
        }

        const removed = await removeEmployee(employeeId);

        return res.status(200).json({
            success: true,
            message: "Employee removed successfully",
            data: removed,
        });
    }
);

export const getMyEmployedRestaurants = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {
            throw new AppError("Access denied", 403);
        }

        const userId = parseInt(user.id, 10);
        const restaurants = await getRestaurantsByUserId(userId);

        return res.status(200).json({
            success: true,
            message: "Employed restaurants fetched successfully",
            data: restaurants,
        });
    }
);
