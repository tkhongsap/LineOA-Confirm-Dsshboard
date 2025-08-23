import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard metrics" });
    }
  });

  // Get chart data for daily trends
  app.get("/api/dashboard/chart-data", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const chartData = await storage.getChartData(days);
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });

  // Get category data for pie chart
  app.get("/api/dashboard/category-data", async (req, res) => {
    try {
      const categoryData = await storage.getCategoryData();
      res.json(categoryData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category data" });
    }
  });

  // Get messages with filtering and pagination
  app.get("/api/messages", async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string,
        search: req.query.search as string,
        limit: parseInt(req.query.limit as string) || 20,
        offset: parseInt(req.query.offset as string) || 0,
      };

      const result = await storage.getMessages(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Export messages as CSV
  app.get("/api/messages/export", async (req, res) => {
    try {
      const filters = {
        status: req.query.status as string,
        search: req.query.search as string,
      };

      const result = await storage.getMessages(filters);
      
      // Convert to CSV format
      const headers = ['Customer Name', 'Phone', 'Sent At', 'Status', 'Response Time', 'Message Content'];
      const csvRows = [headers.join(',')];
      
      result.messages.forEach(message => {
        const row = [
          `"${message.customer.name}"`,
          `"${message.customer.phone}"`,
          `"${message.sentAt.toISOString()}"`,
          `"${message.status}"`,
          message.responseTime ? `"${message.responseTime} minutes"` : '""',
          `"${message.content.replace(/"/g, '""')}"`,
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=delivery_confirmations_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to export messages" });
    }
  });

  // Get single message
  app.get("/api/messages/:id", async (req, res) => {
    try {
      const message = await storage.getMessage(req.params.id);
      if (!message) {
        return res.status(404).json({ error: "Message not found" });
      }
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch message" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
