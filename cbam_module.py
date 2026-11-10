import torch
import torch.nn as nn

class CBAM(nn.Module):
    """CBAM asli (Woo et al., 2018), sesuai Rumus 2.3-2.6 di proposal.

    Channel : Mc(F)  = sigmoid( MLP(AvgPool(F)) + MLP(MaxPool(F)) )   (MLP dipakai bersama, reduction ratio r)
    Spatial : Ms(F') = sigmoid( conv7x7([AvgPool_c(F'); MaxPool_c(F')]) )
    Output  : F''    = Ms(F') * (Mc(F) * F)
    """

    def __init__(self, c1, ratio=16, kernel_size=7):
        super().__init__()
        hidden = max(c1 // ratio, 1)
        self.mlp = nn.Sequential(
            nn.Conv2d(c1, hidden, 1, bias=False), nn.ReLU(inplace=True), nn.Conv2d(hidden, c1, 1, bias=False)
        )
        self.spatial = nn.Conv2d(2, 1, kernel_size, padding=kernel_size // 2, bias=False)

    def forward(self, x):
        ca = torch.sigmoid(self.mlp(x.mean((2, 3), keepdim=True)) + self.mlp(x.amax((2, 3), keepdim=True)))
        x = x * ca
        sa = torch.sigmoid(self.spatial(torch.cat([x.mean(1, keepdim=True), x.amax(1, keepdim=True)], 1)))
        return x * sa

