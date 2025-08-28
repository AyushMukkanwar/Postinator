import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class PostQueueService {
  private readonly logger = new Logger(PostQueueService.name);

  constructor(@InjectQueue('post') private postQueue: Queue) {}

  async addPostToQueue(postId: string, scheduledFor: Date): Promise<void> {
    const delay = scheduledFor.getTime() - Date.now();
    if (delay < 0) {
      this.logger.warn(
        `Scheduled time for post ${postId} is in the past. Adding to queue immediately.`
      );
    }

    await this.postQueue.add(
      'schedulePost', // Job name
      { postId, scheduledFor }, // Job data
      {
        delay: Math.max(0, delay), // Delay in milliseconds
        jobId: postId, // Use postId as jobId for easy lookup/removal
        removeOnComplete: true, // Remove job from queue when completed
        removeOnFail: false, // Keep job in queue on failure for inspection
      }
    );
    this.logger.log(
      `Added post ${postId} to queue for scheduling at ${scheduledFor.toISOString()} with delay ${delay}ms.`
    );
  }

  async updatePostInQueue(
    postId: string,
    newScheduledFor: Date
  ): Promise<void> {
    // In BullMQ, you remove jobs by their ID from the queue.
    // First, get all repeatable jobs, then find and remove the one with the matching key.
    const repeatableJobs = await this.postQueue.getRepeatableJobs();
    const jobToRemove = repeatableJobs.find((job) => job.id === postId);
    if (jobToRemove) {
      await this.postQueue.removeRepeatableByKey(jobToRemove.key);
      this.logger.log(`Removed old job for post ${postId} from queue.`);
    }

    // Add a new job with the updated scheduled time
    const delay = newScheduledFor.getTime() - Date.now();
    if (delay < 0) {
      this.logger.warn(
        `New scheduled time for post ${postId} is in the past. Adding to queue immediately.`
      );
    }

    await this.postQueue.add(
      'schedulePost', // Job name
      { postId, scheduledFor: newScheduledFor }, // Job data
      {
        delay: Math.max(0, delay), // Delay in milliseconds
        jobId: postId, // Use postId as jobId for easy lookup/removal
        removeOnComplete: true,
        removeOnFail: false,
      }
    );
    this.logger.log(
      `Updated post ${postId} in queue with new scheduled time: ${newScheduledFor.toISOString()} with delay ${delay}ms.`
    );
  }

  async removePostFromQueue(postId: string): Promise<void> {
    const repeatableJobs = await this.postQueue.getRepeatableJobs();
    const jobToRemove = repeatableJobs.find((job) => job.id === postId);
    if (jobToRemove) {
      await this.postQueue.removeRepeatableByKey(jobToRemove.key);
      this.logger.log(`Removed post ${postId} from queue.`);
    } else {
      this.logger.warn(
        `Job for post ${postId} not found in queue. It might have already been processed or removed.`
      );
    }
  }
}
