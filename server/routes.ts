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

  // Get batches with filtering and pagination
  app.get("/api/batches", async (req, res) => {
    try {
      const filters = {
        type: req.query.type as 'sent' | 'received' | 'all',
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        limit: parseInt(req.query.limit as string) || 20,
        offset: parseInt(req.query.offset as string) || 0,
      };

      const result = await storage.getBatches(filters);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  // Export batch file
  app.get("/api/batches/:id/export", async (req, res) => {
    try {
      const batch = await storage.getBatch(req.params.id);
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }

      // Generate CSV content based on batch type
      let headers: string[];
      let csvRows: string[];
      
      if (batch.type === 'sent') {
        headers = ['Date', 'File Name', 'Channel', 'Customer Count'];
        csvRows = [
          headers.join(','),
          [
            `"${batch.date}"`,
            `"${batch.fileName}"`,
            `"${batch.channel}"`,
            `"${batch.customerCount}"`,
          ].join(',')
        ];
      } else {
        headers = ['Date', 'File Name', 'Channel', 'Total Responses', 'Confirmed', 'Not Confirmed', 'Questions', 'Other'];
        csvRows = [
          headers.join(','),
          [
            `"${batch.date}"`,
            `"${batch.fileName}"`,
            `"${batch.channel}"`,
            `"${batch.confirmed + batch.notConfirmed + batch.questions + batch.other}"`,
            `"${batch.confirmed}"`,
            `"${batch.notConfirmed}"`,
            `"${batch.questions}"`,
            `"${batch.other}"`,
          ].join(',')
        ];
      }

      const csvContent = csvRows.join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${batch.fileName}`);
      res.send(csvContent);
    } catch (error) {
      res.status(500).json({ error: "Failed to export batch" });
    }
  });

  // Get single batch
  app.get("/api/batches/:id", async (req, res) => {
    try {
      const batch = await storage.getBatch(req.params.id);
      if (!batch) {
        return res.status(404).json({ error: "Batch not found" });
      }
      res.json(batch);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch batch" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
