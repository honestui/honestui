import { Badge } from "@/registry/default/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableSectionHeader,
} from "@/registry/default/ui/table";

export default function TableDemo() {
  return (
    <div className="w-full min-w-0 max-w-4xl">
      <Table>
        <TableCaption>A list of current projects.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Project</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Team</TableHead>
            <TableHead className="text-right" scope="col">
              Budget
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableSectionHeader>
            <TableHead colSpan={4} scope="colgroup">
              Active projects
            </TableHead>
          </TableSectionHeader>
          <TableRow>
            <TableHead className="font-medium text-foreground" scope="row">
              Website Redesign
            </TableHead>
            <TableCell>
              <Badge variant="outline">
                <span
                  className="size-1.5 rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
                Paid
              </Badge>
            </TableCell>
            <TableCell>Frontend Team</TableCell>
            <TableCell className="text-right">$12,500</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="font-medium text-foreground" scope="row">
              Mobile App
            </TableHead>
            <TableCell>
              <Badge variant="outline">
                <span
                  className="size-1.5 rounded-full bg-muted-foreground/64"
                  aria-hidden="true"
                />
                Unpaid
              </Badge>
            </TableCell>
            <TableCell>Mobile Team</TableCell>
            <TableCell className="text-right">$8,750</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="font-medium text-foreground" scope="row">
              API Integration
            </TableHead>
            <TableCell>
              <Badge variant="outline">
                <span
                  className="size-1.5 rounded-full bg-amber-500"
                  aria-hidden="true"
                />
                Pending
              </Badge>
            </TableCell>
            <TableCell>Backend Team</TableCell>
            <TableCell className="text-right">$5,200</TableCell>
          </TableRow>
          <TableSectionHeader>
            <TableHead colSpan={4} scope="colgroup">
              Completed projects
            </TableHead>
          </TableSectionHeader>
          <TableRow>
            <TableHead className="font-medium text-foreground" scope="row">
              Database Migration
            </TableHead>
            <TableCell>
              <Badge variant="outline">
                <span
                  className="size-1.5 rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
                Paid
              </Badge>
            </TableCell>
            <TableCell>DevOps Team</TableCell>
            <TableCell className="text-right">$3,800</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="font-medium text-foreground" scope="row">
              User Dashboard
            </TableHead>
            <TableCell>
              <Badge variant="outline">
                <span
                  className="size-1.5 rounded-full bg-emerald-500"
                  aria-hidden="true"
                />
                Paid
              </Badge>
            </TableCell>
            <TableCell>UX Team</TableCell>
            <TableCell className="text-right">$7,200</TableCell>
          </TableRow>
          <TableRow>
            <TableHead className="font-medium text-foreground" scope="row">
              Security Audit
            </TableHead>
            <TableCell>
              <Badge variant="outline">
                <span
                  className="size-1.5 rounded-full bg-red-500"
                  aria-hidden="true"
                />
                Failed
              </Badge>
            </TableCell>
            <TableCell>Security Team</TableCell>
            <TableCell className="text-right">$2,100</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total Budget</TableCell>
            <TableCell className="text-right font-medium">$39,550</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
