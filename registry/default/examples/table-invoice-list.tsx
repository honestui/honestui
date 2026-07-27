import { Badge } from "@/registry/default/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/default/ui/table"

export default function TableInvoiceList() {
  return (
    <Table className="w-full max-w-md text-sm">
      <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
      <TableBody>
        <TableRow><TableCell>INV-1042</TableCell><TableCell><Badge variant="success">Paid</Badge></TableCell><TableCell className="text-right">$240</TableCell></TableRow>
        <TableRow><TableCell>INV-1043</TableCell><TableCell><Badge variant="warning">Due</Badge></TableCell><TableCell className="text-right">$180</TableCell></TableRow>
      </TableBody>
    </Table>
  )
}
